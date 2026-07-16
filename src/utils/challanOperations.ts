
export const mapRecordToArray = (itemsData: any) => {
  if (!itemsData || !itemsData.items) return [];
  return Object.entries(itemsData.items).map(([sizeId, data]: [string, any]) => ({
    size_id: parseInt(sizeId),
    qty: data.qty || 0,
    borrowed: data.borrowed || 0,
    note: data.note || ''
  })).filter(i => i.qty > 0 || i.borrowed > 0 || i.note !== '');
};

import { supabase } from './supabase';

interface ItemsData {
  size_1_qty?: number;
  size_1_borrowed?: number;
  size_1_note?: string;
  size_2_qty?: number;
  size_2_borrowed?: number;
  size_2_note?: string;
  size_3_qty?: number;
  size_3_borrowed?: number;
  size_3_note?: string;
  size_4_qty?: number;
  size_4_borrowed?: number;
  size_4_note?: string;
  size_5_qty?: number;
  size_5_borrowed?: number;
  size_5_note?: string;
  size_6_qty?: number;
  size_6_borrowed?: number;
  size_6_note?: string;
  size_7_qty?: number;
  size_7_borrowed?: number;
  size_7_note?: string;
  size_8_qty?: number;
  size_8_borrowed?: number;
  size_8_note?: string;
  size_9_qty?: number; size_10_qty?: number;
  size_9_borrowed?: number; size_10_borrowed?: number;
  size_9_note?: string; size_10_note?: string;
}

export const fetchUdharChallans = async () => {
  const { data, error } = await supabase
    .from('udhar_challans')
    .select(`
      *,
      client:clients!inner(
        client_nic_name,
        client_name,
        site,
        primary_phone_number,
        secondary_phone_number
      ),
      items:udhar_items(*)
    `)
    .order('udhar_date', { ascending: true });

  return { data, error };
};

export const fetchJamaChallans = async () => {
  const { data, error } = await supabase
    .from('jama_challans')
    .select(`
      *,
      client:clients!inner(
        client_nic_name,
        client_name,
        site,
        primary_phone_number,
        secondary_phone_number
      ),
      items:jama_items(*)
    `)
    .order('jama_date', { ascending: true });

  return { data, error };
};

export const updateUdharChallan = async (
  challanNumber: string,
  challanData: any,
  itemsData: ItemsData,
  originalItemsData: ItemsData
) => {
  try {
    for (let size = 1; size <= 9; size++) {
      const originalQty = (originalItemsData as any)[`size_${size}_qty`] || 0;
      const originalBorrowed = (originalItemsData as any)[`size_${size}_borrowed`] || 0;

      if (originalQty > 0 || originalBorrowed > 0) {
        const { error } = await supabase.rpc('decrement_stock', {
          p_size: size,
          p_on_rent_decrement: originalQty,
          p_borrowed_decrement: originalBorrowed
        });

        if (error) throw error;
      }
    }

    const { error: challanError } = await supabase
      .from('udhar_challans')
      .update(challanData)
      .eq('udhar_challan_number', challanNumber);

    if (challanError) throw challanError;

    const { error: itemsError } = await supabase
      .from('udhar_items')
      .update(itemsData)
      .eq('udhar_challan_number', challanNumber);

    if (itemsError) throw itemsError;

    for (let size = 1; size <= 9; size++) {
      const newQty = (itemsData as any)[`size_${size}_qty`] || 0;
      const newBorrowed = (itemsData as any)[`size_${size}_borrowed`] || 0;

      if (newQty > 0 || newBorrowed > 0) {
        const { error } = await supabase.rpc('increment_stock', {
          p_size: size,
          p_on_rent_increment: newQty,
          p_borrowed_increment: newBorrowed
        });

        if (error) throw error;
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating udhar challan:', error);
    return { success: false, error: error.message };
  }
};

export const updateJamaChallan = async (
  challanNumber: string,
  challanData: any,
  itemsData: ItemsData,
  originalItemsData: ItemsData
) => {
  try {
    for (let size = 1; size <= 9; size++) {
      const originalQty = (originalItemsData as any)[`size_${size}_qty`] || 0;
      const originalBorrowed = (originalItemsData as any)[`size_${size}_borrowed`] || 0;

      if (originalQty > 0 || originalBorrowed > 0) {
        const { error } = await supabase.rpc('increment_stock', {
          p_size: size,
          p_on_rent_increment: originalQty,
          p_borrowed_increment: originalBorrowed
        });

        if (error) throw error;
      }
    }

    const { error: challanError } = await supabase
      .from('jama_challans')
      .update(challanData)
      .eq('jama_challan_number', challanNumber);

    if (challanError) throw challanError;

    const { error: itemsError } = await supabase
      .from('jama_items')
      .update(itemsData)
      .eq('jama_challan_number', challanNumber);

    if (itemsError) throw itemsError;

    for (let size = 1; size <= 9; size++) {
      const newQty = (itemsData as any)[`size_${size}_qty`] || 0;
      const newBorrowed = (itemsData as any)[`size_${size}_borrowed`] || 0;

      if (newQty > 0 || newBorrowed > 0) {
        const { error } = await supabase.rpc('decrement_stock', {
          p_size: size,
          p_on_rent_decrement: newQty,
          p_borrowed_decrement: newBorrowed
        });

        if (error) throw error;
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating jama challan:', error);
    return { success: false, error: error.message };
  }
};

export const deleteUdharChallan = async (challanNumber: string, itemsData: ItemsData) => {
  try {
    for (let size = 1; size <= 9; size++) {
      const qty = (itemsData as any)[`size_${size}_qty`] || 0;
      const borrowed = (itemsData as any)[`size_${size}_borrowed`] || 0;

      if (qty > 0 || borrowed > 0) {
        const { error } = await supabase.rpc('decrement_stock', {
          p_size: size,
          p_on_rent_decrement: qty,
          p_borrowed_decrement: borrowed
        });

        if (error) throw error;
      }
    }

    const { error: itemsError } = await supabase
      .from('udhar_items')
      .delete()
      .eq('udhar_challan_number', challanNumber);

    if (itemsError) throw itemsError;

    const { error: challanError } = await supabase
      .from('udhar_challans')
      .delete()
      .eq('udhar_challan_number', challanNumber);

    if (challanError) throw challanError;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting udhar challan:', error);
    return { success: false, error: error.message };
  }
};

export const deleteJamaChallan = async (challanNumber: string, itemsData: ItemsData) => {
  try {
    for (let size = 1; size <= 9; size++) {
      const qty = (itemsData as any)[`size_${size}_qty`] || 0;
      const borrowed = (itemsData as any)[`size_${size}_borrowed`] || 0;

      if (qty > 0 || borrowed > 0) {
        const { error } = await supabase.rpc('increment_stock', {
          p_size: size,
          p_on_rent_increment: qty,
          p_borrowed_increment: borrowed
        });

        if (error) throw error;
      }
    }

    const { error: itemsError } = await supabase
      .from('jama_items')
      .delete()
      .eq('jama_challan_number', challanNumber);

    if (itemsError) throw itemsError;

    const { error: challanError } = await supabase
      .from('jama_challans')
      .delete()
      .eq('jama_challan_number', challanNumber);

    if (challanError) throw challanError;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting jama challan:', error);
    return { success: false, error: error.message };
  }
};

export const calculateTotalItems = (items: any) => {
  let total = 0;
  for (let size = 1; size <= 9; size++) {
    total += items[`size_${size}_qty`] || 0;
  }
  return total;
};
