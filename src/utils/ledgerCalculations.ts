import { supabase } from './supabase';
import { mapItemsToRecord } from './challanFetching';

export interface SizeBalance {
  main: number;
  borrowed: number;
  total: number;
}

export interface Transaction {
  type: 'udhar' | 'jama';
  challanNumber: string;
  date: string;
  grandTotal: number;
  sizes: { [key: number]: { qty: number; borrowed: number } };
  site: string;
  driverName: string;
  items: any;
  challanId: string;
}

export interface ClientBalance {
  grandTotal: number;
  sizes: { [key: number]: SizeBalance };
}

export interface ClientLedgerData {
  clientId: string;
  clientNicName: string;
  clientFullName: string;
  clientSite: string;
  clientPhone: string;
  currentBalance: ClientBalance;
  transactions: Transaction[];
}

export async function fetchClientLedger(clientId: string): Promise<ClientLedgerData | null> {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle();

  if (clientError || !client) {
    console.error('Error fetching client:', clientError);
    return null;
  }

  const { data: udharChallans, error: udharError } = await supabase
    .from('udhar_challans')
    .select(`
      udhar_challan_number,
      udhar_date,
      driver_name,
      alternative_site,
      id,
      items:udhar_items!udhar_items_udhar_challan_number_fkey(items, main_note)
    `)
    .eq('client_id', clientId)
    .order('udhar_date', { ascending: true });

  const { data: jamaChallans, error: jamaError } = await supabase
    .from('jama_challans')
    .select(`
      jama_challan_number,
      jama_date,
      driver_name,
      alternative_site,
      id,
      items:jama_items!jama_items_jama_challan_number_fkey(items, main_note)
    `)
    .eq('client_id', clientId)
    .order('jama_date', { ascending: true });

  if (udharError || jamaError) {
    console.error('Error fetching challans:', udharError || jamaError);
    return null;
  }

  const transactions: Transaction[] = [];

  (udharChallans || []).forEach((challan: any) => {
    const parsedItems = mapItemsToRecord(challan.items);
    const sizes: { [key: number]: { qty: number; borrowed: number } } = {};
    let grandTotal = 0;

    Object.entries(parsedItems.items).forEach(([sizeId, data]: [string, any]) => {
      const id = parseInt(sizeId);
      sizes[id] = { qty: data.qty, borrowed: data.borrowed };
      grandTotal += data.qty + data.borrowed;
    });

    transactions.push({
      type: 'udhar',
      challanNumber: challan.udhar_challan_number,
      date: challan.udhar_date,
      grandTotal,
      sizes,
      site: challan.alternative_site || client.site,
      driverName: challan.driver_name || '',
      items: parsedItems,
      challanId: challan.id
    });
  });

  (jamaChallans || []).forEach((challan: any) => {
    const parsedItems = mapItemsToRecord(challan.items);
    const sizes: { [key: number]: { qty: number; borrowed: number } } = {};
    let grandTotal = 0;

    Object.entries(parsedItems.items).forEach(([sizeId, data]: [string, any]) => {
      const id = parseInt(sizeId);
      sizes[id] = { qty: data.qty, borrowed: data.borrowed };
      grandTotal += data.qty + data.borrowed;
    });

    transactions.push({
      type: 'jama',
      challanNumber: challan.jama_challan_number,
      date: challan.jama_date,
      grandTotal,
      sizes,
      site: challan.alternative_site || client.site,
      driverName: challan.driver_name || '',
      items: parsedItems,
      challanId: challan.id
    });
  });

  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const currentBalance = calculateBalance(transactions);

  return {
    clientId: client.id,
    clientNicName: client.client_nic_name,
    clientFullName: client.client_name,
    clientSite: client.site,
    clientPhone: client.primary_phone_number,
    currentBalance,
    transactions
  };
}

export function calculateBalance(transactions: Transaction[]): ClientBalance {
  const balance: ClientBalance = {
    grandTotal: 0,
    sizes: {}
  };

  transactions.forEach(transaction => {
    Object.entries(transaction.sizes).forEach(([sizeIdStr, sizeData]) => {
      const sizeId = parseInt(sizeIdStr);
      if (!balance.sizes[sizeId]) {
        balance.sizes[sizeId] = { main: 0, borrowed: 0, total: 0 };
      }
      
      if (transaction.type === 'udhar') {
        balance.sizes[sizeId].main += sizeData.qty;
        balance.sizes[sizeId].borrowed += sizeData.borrowed;
      } else {
        balance.sizes[sizeId].main -= sizeData.qty;
        balance.sizes[sizeId].borrowed -= sizeData.borrowed;
      }
      balance.sizes[sizeId].total = balance.sizes[sizeId].main + balance.sizes[sizeId].borrowed;
    });
  });

  balance.grandTotal = Object.values(balance.sizes).reduce((sum, size) => sum + size.total, 0);

  return balance;
}

export async function fetchAllClientLedgers(): Promise<ClientLedgerData[]> {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('client_nic_name', { ascending: true });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  const ledgers = await Promise.all(
    (clients || []).map(async (client) => {
      const ledger = await fetchClientLedger(client.id);
      return ledger;
    })
  );

  return ledgers.filter((ledger): ledger is ClientLedgerData => ledger !== null);
}
