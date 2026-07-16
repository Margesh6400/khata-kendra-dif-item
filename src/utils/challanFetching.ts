
export const mapItemsToRecord = (rawItems: any, mainNote: string = '') => {
  const record: Record<number, { qty: number, borrowed: number, note: string }> = {};
  
  if (!rawItems) return { items: record, main_note: mainNote };
  
  // If it's a joined row array, take the first
  const itemRow = Array.isArray(rawItems) && rawItems.length > 0 && !rawItems[0].size_id ? rawItems[0] : rawItems;
  
  // items array from jsonb
  const jsonArray = itemRow.items || itemRow || [];
  const arrayToProcess = Array.isArray(jsonArray) ? jsonArray : [];
  
  arrayToProcess.forEach((item: any) => {
    if (item.size_id) {
      record[item.size_id] = {
        qty: item.qty || 0,
        borrowed: item.borrowed || 0,
        note: item.note || ''
      };
    }
  });
  
  return { items: record, main_note: itemRow.main_note || mainNote };
};

import { supabase } from './supabase';

interface ItemsData {
  [key: string]: any;
  main_note: string | null;
}

const emptyItems: ItemsData = {
  main_note: null,
};

export const fetchUdharChallansForClient = async (clientId?: string) => {
  let query = supabase
    .from('udhar_challans')
    .select(`
      udhar_challan_number,
      udhar_date,
      driver_name,
      driver_mobile,
      vehicle_number,
      alternative_site,
      secondary_phone_number,
      client_id,
      client:clients!udhar_challans_client_id_fkey (
        id,
        client_nic_name,
        client_name,
        site,
        primary_phone_number
      ),
      items:udhar_items!udhar_items_udhar_challan_number_fkey(items, main_note)
    `)
    .order('udhar_date', { ascending: true });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching udhar challans:', error);
    return [];
  }

  const transformedData = (data || []).map((challan: any) => {
    const parsedItems = mapItemsToRecord(challan.items);

    return {
      challanNumber: challan.udhar_challan_number,
      date: challan.udhar_date,
      type: 'udhar' as const,
      driverName: challan.driver_name,
      driverMobile: challan.driver_mobile,
      vehicleNumber: challan.vehicle_number,
      clientNicName: challan.client?.client_nic_name || '',
      clientFullName: challan.client?.client_name || '',
      clientId: challan.client_id,
      site: challan.alternative_site || challan.client?.site || '',
      isAlternativeSite: !!challan.alternative_site,
      phone: challan.secondary_phone_number || challan.client?.primary_phone_number || '',
      isSecondaryPhone: !!challan.secondary_phone_number,
      items: parsedItems,
    };
  });

  return transformedData;
};

export const fetchJamaChallansForClient = async (clientId?: string) => {
  let query = supabase
    .from('jama_challans')
    .select(`
      jama_challan_number,
      jama_date,
      driver_name,
      driver_mobile,
      vehicle_number,
      alternative_site,
      secondary_phone_number,
      client_id,
      client:clients!jama_challans_client_id_fkey (
        id,
        client_nic_name,
        client_name,
        site,
        primary_phone_number
      ),
      items:jama_items!jama_items_jama_challan_number_fkey(items, main_note)
    `)
    .order('jama_date', { ascending: true });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching jama challans:', error);
    return [];
  }

  const transformedData = (data || []).map((challan: any) => {
    const parsedItems = mapItemsToRecord(challan.items);

    return {
      challanNumber: challan.jama_challan_number,
      date: challan.jama_date,
      type: 'jama' as const,
      driverName: challan.driver_name,
      driverMobile: challan.driver_mobile,
      vehicleNumber: challan.vehicle_number,
      clientNicName: challan.client?.client_nic_name || '',
      clientFullName: challan.client?.client_name || '',
      clientId: challan.client_id,
      site: challan.alternative_site || challan.client?.site || '',
      isAlternativeSite: !!challan.alternative_site,
      phone: challan.secondary_phone_number || challan.client?.primary_phone_number || '',
      isSecondaryPhone: !!challan.secondary_phone_number,
      items: parsedItems,
    };
  });

  return transformedData;
};

export const fetchDailyChallans = async (date: Date) => {
  const dateStr = date.toISOString().split('T')[0];

  const [udharChallans, jamaChallans, bills] = await Promise.all([
    supabase
      .from('udhar_challans')
      .select(`
        udhar_challan_number,
        udhar_date,
        driver_name,
        alternative_site,
        secondary_phone_number,
        client_id,
        client:clients!udhar_challans_client_id_fkey (
          id,
          client_nic_name,
          client_name,
          site,
          primary_phone_number
        ),
        items:udhar_items!udhar_items_udhar_challan_number_fkey(items, main_note)
      `)
      .eq('udhar_date', dateStr)
      .order('udhar_challan_number', { ascending: false }),
    supabase
      .from('jama_challans')
      .select(`
        jama_challan_number,
        jama_date,
        driver_name,
        alternative_site,
        secondary_phone_number,
        client_id,
        client:clients!jama_challans_client_id_fkey (
          id,
          client_nic_name,
          client_name,
          site,
          primary_phone_number
        ),
        items:jama_items!jama_items_jama_challan_number_fkey(items, main_note)
      `)
      .eq('jama_date', dateStr)
      .order('jama_challan_number', { ascending: false }),
    supabase
      .from('bills')
      .select(`
        bill_number,
        billing_date,
        total_rent_amount,
        total_extra_cost,
        client_id,
        client:clients (
          client_nic_name,
          client_name,
          site,
          primary_phone_number
        )
      `)
      .eq('billing_date', dateStr)
      .order('created_at', { ascending: false })
  ]);

  const mapChallan = (challan: any, type: 'udhar' | 'jama') => {
    const parsedItems = mapItemsToRecord(challan.items);

    return {
      challanNumber: type === 'udhar' ? challan.udhar_challan_number : challan.jama_challan_number,
      date: type === 'udhar' ? challan.udhar_date : challan.jama_date,
      type,
      driverName: challan.driver_name,
      clientNicName: challan.client?.client_nic_name || '',
      clientFullName: challan.client?.client_name || '',
      clientId: challan.client_id,
      site: challan.alternative_site || challan.client?.site || '',
      isAlternativeSite: !!challan.alternative_site,
      phone: challan.secondary_phone_number || challan.client?.primary_phone_number || '',
      isSecondaryPhone: !!challan.secondary_phone_number,
      items: parsedItems,
      totalItems: calculateTotalFromItems(parsedItems)
    };
  };

  const mapBill = (bill: any) => ({
    challanNumber: bill.bill_number,
    date: bill.billing_date,
    type: 'bill' as const,
    driverName: '',
    clientNicName: bill.client?.client_nic_name || '',
    clientFullName: bill.client?.client_name || '',
    clientId: bill.client_id,
    site: bill.client?.site || '',
    isAlternativeSite: false,
    phone: bill.client?.primary_phone_number || '',
    isSecondaryPhone: false,
    items: emptyItems,
    totalItems: 0,
    amount: (bill.total_rent_amount || 0) + (bill.total_extra_cost || 0)
  });

  const udharData = (udharChallans.data || []).map(c => mapChallan(c, 'udhar'));
  const jamaData = (jamaChallans.data || []).map(c => mapChallan(c, 'jama'));
  const billData = (bills.data || []).map(b => mapBill(b));

  return [...billData, ...udharData, ...jamaData].sort((a, b) => {
    // Basic sort by ID/Number usually works if formats align, otherwise standard collator
    return b.challanNumber.localeCompare(a.challanNumber);
  });
};

// Cache for transactions to avoid redundant fetches
const transactionCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const fetchClientTransactions = async (clientId: string) => {
  // Check cache first
  const cached = transactionCache.get(clientId);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }

  const [udharChallans, jamaChallans] = await Promise.all([
    fetchUdharChallansForClient(clientId),
    fetchJamaChallansForClient(clientId),
  ]);

  const allTransactions = [...udharChallans, ...jamaChallans].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Cache the results
  transactionCache.set(clientId, { data: allTransactions, timestamp: Date.now() });

  return allTransactions;
};

export const clearTransactionCache = () => transactionCache.clear();

// Fetch transactions for multiple clients in 2 queries instead of 2×N queries.
// Returns a Map<clientId, transaction[]> sorted by date ascending per client.
export const fetchBulkClientTransactions = async (clientIds: string[]): Promise<Map<string, any[]>> => {
  if (clientIds.length === 0) return new Map();

  const [udharResult, jamaResult] = await Promise.all([
    supabase
      .from('udhar_challans')
      .select(`
        udhar_challan_number,
        udhar_date,
        driver_name,
        alternative_site,
        secondary_phone_number,
        client_id,
        items:udhar_items!udhar_items_udhar_challan_number_fkey(items, main_note)
      `)
      .in('client_id', clientIds)
      .order('udhar_date', { ascending: true }),
    supabase
      .from('jama_challans')
      .select(`
        jama_challan_number,
        jama_date,
        driver_name,
        alternative_site,
        secondary_phone_number,
        client_id,
        items:jama_items!jama_items_jama_challan_number_fkey(items, main_note)
      `)
      .in('client_id', clientIds)
      .order('jama_date', { ascending: true }),
  ]);

  const byClient = new Map<string, any[]>();

  (udharResult.data || []).forEach((challan: any) => {
    const cid = challan.client_id;
    if (!byClient.has(cid)) byClient.set(cid, []);
    const parsedItems = mapItemsToRecord(challan.items);
    byClient.get(cid)!.push({
      challanNumber: challan.udhar_challan_number,
      date: challan.udhar_date,
      type: 'udhar' as const,
      driverName: challan.driver_name || '',
      clientId: cid,
      site: challan.alternative_site || '',
      isAlternativeSite: !!challan.alternative_site,
      phone: challan.secondary_phone_number || '',
      isSecondaryPhone: !!challan.secondary_phone_number,
      items: parsedItems,
    });
  });

  (jamaResult.data || []).forEach((challan: any) => {
    const cid = challan.client_id;
    if (!byClient.has(cid)) byClient.set(cid, []);
    const parsedItems = mapItemsToRecord(challan.items);
    byClient.get(cid)!.push({
      challanNumber: challan.jama_challan_number,
      date: challan.jama_date,
      type: 'jama' as const,
      driverName: challan.driver_name || '',
      clientId: cid,
      site: challan.alternative_site || '',
      isAlternativeSite: !!challan.alternative_site,
      phone: challan.secondary_phone_number || '',
      isSecondaryPhone: !!challan.secondary_phone_number,
      items: parsedItems,
    });
  });

  // Sort each client's transactions chronologically
  byClient.forEach((txs, cid) => {
    byClient.set(cid, txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  });

  return byClient;
};

export const calculateTotalFromItems = (itemsData: any): number => {
  if (!itemsData || !itemsData.items) return 0;
  return Object.values(itemsData.items).reduce((sum: number, item: any) => sum + (item.qty || 0) + (item.borrowed || 0), 0);
};
