import { supabase } from '../utils/supabase';

interface ChallanValidationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export const validateClientData = async (clientId: string): Promise<ChallanValidationResult> => {
  try {
    // 1. Fetch and validate client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError) {
      return {
        success: false,
        message: 'Failed to fetch client data',
        error: clientError
      };
    }

    if (!client) {
      return {
        success: false,
        message: 'Client not found',
      };
    }

    // 2. Fetch and validate Udhar challans
    // First fetch udhar challans
    const { data: udharChallans, error: udharError } = await supabase
      .from('udhar_challans')
      .select('*')
      .eq('client_id', clientId)
      .order('udhar_date', { ascending: true });

    if (udharError) {
      return {
        success: false,
        message: 'Failed to fetch udhar challans',
        error: udharError
      };
    }

    // Then fetch items for each challan
    const challanItems: Record<string, any[]> = {};
    if (udharChallans && udharChallans.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('udhar_items')
        .select('*')
        .in('udhar_challan_number', udharChallans.map(c => c.udhar_challan_number));

      if (itemsError) {
        return {
          success: false,
          message: 'Failed to fetch udhar items',
          error: itemsError
        };
      }

      // Group items by challan number
      if (items) {
        items.forEach(item => {
          if (!challanItems[item.udhar_challan_number]) {
            challanItems[item.udhar_challan_number] = [];
          }
          challanItems[item.udhar_challan_number].push(item);
        });
      }

      // Attach items to their respective challans
      udharChallans.forEach(challan => {
        challan.items = challanItems[challan.udhar_challan_number] || [];
      });
    }

    // Debug: Log the structure of the first challan
    if (udharChallans && udharChallans.length > 0) {
      console.log('First Udhar Challan Structure:', {
        challan: udharChallans[0],
        hasItems: Array.isArray(udharChallans[0].udhar_items),
        itemsLength: udharChallans[0].udhar_items?.length
      });
    } else {
      console.log('No udhar challans found for client');
    }

    // 3. Fetch and validate Jama challans
    // First fetch jama challans
    const { data: jamaChallans, error: jamaError } = await supabase
      .from('jama_challans')
      .select('*')
      .eq('client_id', clientId)
      .order('jama_date', { ascending: true });

    if (jamaError) {
      return {
        success: false,
        message: 'Failed to fetch jama challans',
        error: jamaError
      };
    }

    // Then fetch items for each challan
    const jamaItems: Record<string, any[]> = {};
    if (jamaChallans && jamaChallans.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('jama_items')
        .select('*')
        .in('jama_challan_number', jamaChallans.map(c => c.jama_challan_number));

      if (itemsError) {
        return {
          success: false,
          message: 'Failed to fetch jama items',
          error: itemsError
        };
      }

      // Group items by challan number
      if (items) {
        items.forEach(item => {
          if (!jamaItems[item.jama_challan_number]) {
            jamaItems[item.jama_challan_number] = [];
          }
          jamaItems[item.jama_challan_number].push(item);
        });
      }

      // Attach items to their respective challans
      jamaChallans.forEach(challan => {
        challan.items = jamaItems[challan.jama_challan_number] || [];
      });
    }

    // 4. Validate data integrity
    const validation = {
      clientData: validateClientFields(client),
      udharChallans: validateUdharChallans(udharChallans || []),
      jamaChallans: validateJamaChallans(jamaChallans || [])
    };

    if (!validation.clientData.valid) {
      return {
        success: false,
        message: `Invalid client data: ${validation.clientData.errors.join(', ')}`,
      };
    }

    if (!validation.udharChallans.valid) {
      return {
        success: false,
        message: `Invalid udhar challans: ${validation.udharChallans.errors.join(', ')}`,
      };
    }

    if (!validation.jamaChallans.valid) {
      return {
        success: false,
        message: `Invalid jama challans: ${validation.jamaChallans.errors.join(', ')}`,
      };
    }

    return {
      success: true,
      message: 'All data fetched and validated successfully',
      data: {
        client,
        udharChallans,
        jamaChallans,
        validation
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Unexpected error during validation',
      error
    };
  }
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const validateClientFields = (client: any): ValidationResult => {
  const errors: string[] = [];

  if (!client.id) errors.push('Missing client ID');
  if (!client.client_name) errors.push('Missing client name');
  if (!client.client_nic_name) errors.push('Missing client nickname');
  if (!client.primary_phone_number) errors.push('Missing phone number');
  if (!client.site) errors.push('Missing site');

  return {
    valid: errors.length === 0,
    errors
  };
};

interface ChallanItem {
  [key: string]: any;
  udhar_challan_number?: string;
  size_1_qty?: number;
  size_2_qty?: number;
  size_3_qty?: number;
  size_4_qty?: number;
  size_5_qty?: number;
  size_6_qty?: number;
  size_7_qty?: number;
  size_8_qty?: number;
  size_9_qty?: number; size_10_qty?: number;
  size_1_borrowed?: number;
  size_2_borrowed?: number;
  size_3_borrowed?: number;
  size_4_borrowed?: number;
  size_5_borrowed?: number;
  size_6_borrowed?: number;
  size_7_borrowed?: number;
  size_8_borrowed?: number;
  size_9_borrowed?: number; size_10_borrowed?: number;
}

interface Challan {
  id?: string;
  udhar_challan_number: string;
  udhar_date: string;
  items: ChallanItem[];
}

const validateUdharChallans = (challans: Challan[]): ValidationResult => {
  const errors: string[] = [];

  if (!Array.isArray(challans)) {
    return {
      valid: false,
      errors: ['Invalid challans data structure']
    };
  }

  challans.forEach((challan, index) => {
    // Debug log for each challan
    console.log(`Validating Udhar Challan ${index + 1}:`, {
      challanNumber: challan.udhar_challan_number,
      date: challan.udhar_date,
      itemsCount: challan.items?.length
    });

    if (!challan.udhar_date) {
      errors.push(`Challan ${challan.udhar_challan_number || index + 1}: Missing date`);
    }
    if (!challan.udhar_challan_number) {
      errors.push(`Challan ${index + 1}: Missing challan number`);
    }
    
    // Check items array
    if (!Array.isArray(challan.items)) {
      console.error(`Invalid items for challan ${challan.udhar_challan_number}:`, challan.items);
      errors.push(`Challan ${challan.udhar_challan_number || index + 1}: Missing or invalid items`);
      return;
    }

    if (challan.items.length === 0) {
      console.warn(`No items found for challan ${challan.udhar_challan_number}`);
      errors.push(`Challan ${challan.udhar_challan_number || index + 1}: No items found`);
      return;
    }

    // Validate each item
    challan.items.forEach((item: ChallanItem) => {
      let hasQuantity = false;
      if (item.items && Array.isArray(item.items)) {
        item.items.forEach((subItem: any) => {
          const qty = Math.max(0, Number(subItem.qty) || 0);
          const borrowed = Math.max(0, Number(subItem.borrowed) || 0);
          subItem.qty = qty;
          subItem.borrowed = borrowed;
          if (qty > 0 || borrowed > 0) {
            hasQuantity = true;
          }
        });
      } else {
        for (let size = 1; size <= 10; size++) {
          const qtyField = `size_${size}_qty`;
          const borrowedField = `size_${size}_borrowed`;
          const qty = Math.max(0, Number(item[qtyField]) || 0);
          const borrowed = Math.max(0, Number(item[borrowedField]) || 0);
          item[qtyField] = qty;
          item[borrowedField] = borrowed;
          if (qty > 0 || borrowed > 0) {
            hasQuantity = true;
          }
        }
      }

      if (!hasQuantity) {
        console.warn(`No quantities found in item for challan ${challan.udhar_challan_number}:`, item);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

interface JamaChallanItem {
  [key: string]: any;
  jama_challan_number?: string;
  size_1_qty?: number;
  size_2_qty?: number;
  size_3_qty?: number;
  size_4_qty?: number;
  size_5_qty?: number;
  size_6_qty?: number;
  size_7_qty?: number;
  size_8_qty?: number;
  size_9_qty?: number; size_10_qty?: number;
  size_1_borrowed?: number;
  size_2_borrowed?: number;
  size_3_borrowed?: number;
  size_4_borrowed?: number;
  size_5_borrowed?: number;
  size_6_borrowed?: number;
  size_7_borrowed?: number;
  size_8_borrowed?: number;
  size_9_borrowed?: number; size_10_borrowed?: number;
}

interface JamaChallan {
  id?: string;
  jama_challan_number: string;
  jama_date: string;
  items: JamaChallanItem[];
}

const validateJamaChallans = (challans: JamaChallan[]): ValidationResult => {
  const errors: string[] = [];

  if (!Array.isArray(challans)) {
    return {
      valid: false,
      errors: ['Invalid challans data structure']
    };
  }

  challans.forEach((challan, index) => {
    // Debug log for each challan
    console.log(`Validating Jama Challan ${index + 1}:`, {
      challanNumber: challan.jama_challan_number,
      date: challan.jama_date,
      itemsCount: challan.items?.length
    });

    if (!challan.jama_date) {
      errors.push(`Challan ${challan.jama_challan_number || index + 1}: Missing date`);
    }
    if (!challan.jama_challan_number) {
      errors.push(`Challan ${index + 1}: Missing challan number`);
    }
    
    // Check items array
    if (!Array.isArray(challan.items)) {
      console.error(`Invalid items for challan ${challan.jama_challan_number}:`, challan.items);
      errors.push(`Challan ${challan.jama_challan_number || index + 1}: Missing or invalid items`);
      return;
    }

    if (challan.items.length === 0) {
      console.warn(`No items found for challan ${challan.jama_challan_number}`);
      errors.push(`Challan ${challan.jama_challan_number || index + 1}: No items found`);
      return;
    }

    // Validate each item
    challan.items.forEach((item: JamaChallanItem) => {
      let hasQuantity = false;
      if (item.items && Array.isArray(item.items)) {
        item.items.forEach((subItem: any) => {
          const qty = Math.max(0, Number(subItem.qty) || 0);
          const borrowed = Math.max(0, Number(subItem.borrowed) || 0);
          subItem.qty = qty;
          subItem.borrowed = borrowed;
          if (qty > 0 || borrowed > 0) {
            hasQuantity = true;
          }
        });
      } else {
        for (let size = 1; size <= 10; size++) {
          const qtyField = `size_${size}_qty`;
          const borrowedField = `size_${size}_borrowed`;
          const qty = Math.max(0, Number(item[qtyField]) || 0);
          const borrowed = Math.max(0, Number(item[borrowedField]) || 0);
          item[qtyField] = qty;
          item[borrowedField] = borrowed;
          if (qty > 0 || borrowed > 0) {
            hasQuantity = true;
          }
        }
      }

      if (!hasQuantity) {
        console.warn(`No quantities found in item for challan ${challan.jama_challan_number}:`, item);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
};