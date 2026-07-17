// Supabase Edge Function, scheduled by pg_cron on the 1st of every month
// (see migration 20260717*_app_settings_and_bill_cron.sql).
// Creates a draft bill for every client with outstanding plates or unbilled
// challan activity, covering up to the last day of the previous month.
//
// Reuses the exact same calculateBill() the app uses in CreateBill, so the
// numbers always match a manually created bill. The jamaFirst / standard
// date-sorting method is read from the app_settings table (synced by the
// Settings screen), so cron bills follow the app's bill calculation setting.
//
// Batching: clients are processed in concurrent chunks. If the run nears the
// wall-clock limit, it re-invokes itself and returns a partial report; the
// next pass naturally skips already-billed clients (idempotent), so the chain
// continues where it left off. MAX_PASSES caps the chain.
//
// Secrets (supabase secrets set):
//   CRON_SECRET - pg_cron sends it as "Authorization: Bearer <secret>"
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { addDays, format, parseISO, startOfMonth, subDays } from 'date-fns';
import {
  calculateBill,
  getChallanTotalPlates,
} from '../../../src/utils/billingPeriodCalculations.ts';

const CHUNK_SIZE = 5; // clients processed concurrently
const TIME_BUDGET_MS = 100_000; // stop starting new chunks after this (150s wall clock)
const MAX_PASSES = 10; // safety cap on self-reinvocation chain

interface ClientRow {
  id: string;
  client_nic_name: string;
  daily_rent_price: number | null;
  jack_rents: Record<number, number> | null;
}

// PostgrestError is a plain object, not an Error instance — String() gives "[object Object]"
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  return JSON.stringify(err);
}

type Outcome =
  | { kind: 'created'; bill_number: string; client: string; total_rent: number; due: number }
  | { kind: 'skipped'; client: string; reason: string }
  | { kind: 'error'; client: string; error: string };

async function processClient(
  supabase: SupabaseClient,
  client: ClientRow,
  plateSizes: unknown[],
  periodEnd: string,
  billingDate: string,
  jamaFirst: boolean,
  trigger: 'cron' | 'manual'
): Promise<Outcome> {
  const label = client.client_nic_name;
  try {
    // Same select shapes as CreateBill.tsx so calculateBill sees identical data
    const [udharRes, jamaRes, billsRes] = await Promise.all([
      supabase
        .from('udhar_challans')
        .select('udhar_challan_number, udhar_date, items:udhar_items (items, main_note)')
        .eq('client_id', client.id)
        .order('udhar_date', { ascending: true }),
      supabase
        .from('jama_challans')
        .select('jama_challan_number, jama_date, is_all_return, items:jama_items (items, main_note)')
        .eq('client_id', client.id)
        .order('jama_date', { ascending: true }),
      supabase
        .from('bills')
        .select('bill_number, due_payment, to_date')
        .eq('client_id', client.id)
        .order('to_date', { ascending: true }),
    ]);
    if (udharRes.error) throw udharRes.error;
    if (jamaRes.error) throw jamaRes.error;
    if (billsRes.error) throw billsRes.error;

    const udharChallans = udharRes.data || [];
    const jamaChallans = jamaRes.data || [];
    const bills = billsRes.data || [];

    if (udharChallans.length === 0) {
      return { kind: 'skipped', client: label, reason: 'no udhar challans' };
    }

    const lastBill = bills.length > 0 ? bills[bills.length - 1] : null;
    const fromDate = lastBill?.to_date
      ? format(addDays(parseISO(lastBill.to_date), 1), 'yyyy-MM-dd')
      : udharChallans[0].udhar_date;

    if (fromDate > periodEnd) {
      return { kind: 'skipped', client: label, reason: `already billed through ${lastBill?.to_date}` };
    }

    const outstanding =
      udharChallans.reduce((sum, ch) => sum + getChallanTotalPlates(ch), 0) -
      jamaChallans.reduce((sum, ch) => sum + getChallanTotalPlates(ch), 0);
    const hasActivity =
      udharChallans.some((ch) => ch.udhar_date >= fromDate && ch.udhar_date <= periodEnd) ||
      jamaChallans.some((ch) => ch.jama_date >= fromDate && ch.jama_date <= periodEnd);

    if (outstanding <= 0 && !hasActivity) {
      return { kind: 'skipped', client: label, reason: 'settled, no activity in period' };
    }

    const dailyRent = client.daily_rent_price ?? 1;
    const result = calculateBill(
      udharChallans,
      jamaChallans,
      periodEnd,
      dailyRent,
      [], // extra charges — added by owner on review
      [], // discounts
      [], // payments
      10,
      fromDate,
      plateSizes,
      client.jack_rents || {},
      jamaFirst // from app_settings.date_sorting_method — same as the app's Settings screen
    );

    const totalRent = result.billingPeriods.totalRent;
    const pending = lastBill?.due_payment || 0;

    // Next bill number in the NICNAME/N sequence
    const sequence =
      bills.reduce((max, b) => {
        const match = b.bill_number.match(/\/(\d+)$/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0) + 1;
    const billNumber = `${label}/${sequence}`;

    const { error: insertError } = await supabase.from('bills').insert({
      bill_number: billNumber,
      client_id: client.id,
      billing_date: billingDate,
      from_date: fromDate,
      to_date: periodEnd,
      daily_rent: dailyRent,
      total_rent_amount: totalRent,
      total_extra_cost: 0,
      total_discount: 0,
      total_payment: 0,
      due_payment: Math.round(totalRent + pending),
      status: 'draft',
      generated_by: trigger,
    });
    if (insertError) throw insertError;

    return {
      kind: 'created',
      bill_number: billNumber,
      client: label,
      total_rent: totalRent,
      due: Math.round(totalRent + pending),
    };
  } catch (err) {
    return { kind: 'error', client: label, error: errorMessage(err) };
  }
}

// Fire a request to this same endpoint so the next invocation picks up the
// remaining clients. Wait just long enough for delivery, then move on.
async function reinvokeSelf(
  selfUrl: string,
  nextPass: number,
  trigger: string,
  clientIds: string[] | null
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    await fetch(`${selfUrl}?pass=${nextPass}&trigger=${trigger}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${Deno.env.get('CRON_SECRET')}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(clientIds ? { client_ids: clientIds } : {}),
      signal: controller.signal,
    });
  } catch {
    // AbortError is expected — the new invocation is already running
  } finally {
    clearTimeout(timer);
  }
}

// Browser calls (Create All Bills button) need CORS headers on every
// response, plus a handler for the OPTIONS preflight the browser sends first.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // x-my-custom-header: sent by the app's supabase client on every request (src/utils/supabase.ts)
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-my-custom-header',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  const startedAt = Date.now();
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  const url = new URL(req.url);
  const authHeader = req.headers.get('authorization') || '';

  // Two callers allowed: pg_cron (shared secret) and logged-in app users
  // (Create All Bills button — supabase.functions.invoke sends the user JWT).
  const isCron = authHeader === `Bearer ${Deno.env.get('CRON_SECRET')}`;
  let trigger: 'cron' | 'manual';
  if (isCron) {
    // Continuation passes authenticate with the cron secret but must keep the
    // trigger label of the invocation that started the chain.
    trigger = url.searchParams.get('trigger') === 'manual' ? 'manual' : 'cron';
  } else {
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    const { data, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !data?.user) {
      return json({ error: 'Unauthorized' }, 401);
    }
    trigger = 'manual';
  }

  const pass = parseInt(url.searchParams.get('pass') || '1', 10) || 1;
  if (pass > MAX_PASSES) {
    return json({ error: `pass limit (${MAX_PASSES}) reached, stopping chain` });
  }

  // Optional client filter from the Create All Bills modal
  const body = await req.json().catch(() => ({}));
  const clientIds: string[] | null =
    Array.isArray(body?.client_ids) && body.client_ids.length > 0 ? body.client_ids : null;

  // Settings-screen kill switch: only blocks scheduled runs, never the button
  if (trigger === 'cron') {
    const { data: cronSetting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'monthly_bill_cron_enabled')
      .maybeSingle();
    if (cronSetting?.value === 'false') {
      return json({ cron_enabled: false, message: 'Monthly bill cron is disabled in Settings' });
    }
  }

  const now = new Date();
  // Bill covers up to the last day of the previous month; billing_date = run date
  const periodEnd = format(subDays(startOfMonth(now), 1), 'yyyy-MM-dd');
  const billingDate = format(now, 'yyyy-MM-dd');

  const outcomes: Outcome[] = [];
  let continued = false;

  try {
    // Bill calculation setting synced from the app's Settings screen
    const { data: sortSetting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'date_sorting_method')
      .maybeSingle();
    const jamaFirst = sortSetting?.value === 'jamaFirst';

    const { data: plateSizes, error: sizesError } = await supabase
      .from('plate_sizes')
      .select('*')
      .order('sort_order', { ascending: true });
    if (sizesError) throw sizesError;

    let clientsQuery = supabase
      .from('clients')
      .select('id, client_nic_name, daily_rent_price, jack_rents')
      .order('client_nic_name', { ascending: true });
    if (clientIds) clientsQuery = clientsQuery.in('id', clientIds);
    const { data: clients, error: clientsError } = await clientsQuery;
    if (clientsError) throw clientsError;

    const queue = (clients || []) as ClientRow[];
    const selfUrl = `${url.origin}${url.pathname}`;

    for (let i = 0; i < queue.length; i += CHUNK_SIZE) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        await reinvokeSelf(selfUrl, pass + 1, trigger, clientIds);
        continued = true;
        break;
      }
      const chunk = queue.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(
        chunk.map((client) =>
          processClient(supabase, client, plateSizes || [], periodEnd, billingDate, jamaFirst, trigger)
        )
      );
      outcomes.push(...results);
    }

    return json({
      pass,
      continued, // true = time budget hit, a follow-up invocation is finishing the rest
      trigger,
      date_sorting_method: jamaFirst ? 'jamaFirst' : 'standard',
      period: { to: periodEnd, billing_date: billingDate },
      created: outcomes.filter((o) => o.kind === 'created'),
      skipped: outcomes.filter((o) => o.kind === 'skipped'),
      errors: outcomes.filter((o) => o.kind === 'error'),
    });
  } catch (err) {
    return json(
      {
        error: errorMessage(err),
        pass,
        created: outcomes.filter((o) => o.kind === 'created'),
        skipped: outcomes.filter((o) => o.kind === 'skipped'),
        errors: outcomes.filter((o) => o.kind === 'error'),
      },
      500
    );
  }
});
