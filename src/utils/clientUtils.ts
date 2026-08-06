import { supabase } from './supabase';

/**
 * Checks if a client with the given client_nic_name (sort name) already exists.
 * 
 * If enableCategoryClientSeparation is TRUE:
 * - Duplicate check only matches within the SAME business category.
 *   (e.g., 'shuttering', 'jack', 'cuplock', 'other').
 *   Clients with category null/undefined/'' are treated as 'shuttering'.
 * 
 * If enableCategoryClientSeparation is FALSE:
 * - Duplicate check is global across all categories.
 * 
 * @returns true if a duplicate client exists, false otherwise.
 */
export const checkDuplicateClient = async (
  clientNicName: string,
  targetCategory: string | null | undefined,
  enableCategoryClientSeparation: boolean,
  excludeClientId?: string
): Promise<boolean> => {
  const trimmedNicName = (clientNicName || '').trim();
  if (!trimmedNicName) return false;

  let query = supabase
    .from('clients')
    .select('id, category, client_nic_name')
    .eq('client_nic_name', trimmedNicName);

  if (excludeClientId) {
    query = query.neq('id', excludeClientId);
  }

  const { data: existingClients, error } = await query;
  if (error) {
    console.error('Error checking duplicate client:', error);
    return false;
  }

  if (!existingClients || existingClients.length === 0) {
    return false;
  }

  const normTarget = (targetCategory || 'shuttering').toLowerCase();

  if (enableCategoryClientSeparation) {
    return existingClients.some((c: any) => {
      const cCat = (c.category || 'shuttering').toLowerCase();
      return cCat === normTarget;
    });
  }

  // If separate client lists per category is OFF, any existing client with the same name is a duplicate
  return true;
};
