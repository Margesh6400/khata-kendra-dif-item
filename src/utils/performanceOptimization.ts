/**
 * Performance Optimization Utilities
 * Provides efficient algorithms for common operations to reduce time complexity
 */

// Constants for size ranges
const SIZES = Array.from({ length: 9 }, (_, i) => i + 1);
const EMPTY_SIZE_BALANCE = Object.freeze({
  size_1: 0, size_2: 0, size_3: 0, size_4: 0, size_5: 0,
  size_6: 0, size_7: 0, size_8: 0, size_9: 0, size_10: 0, grandTotal: 0
} as const);

/**
 * Batch calculate size balances from multiple challan arrays
 * O(n) complexity vs O(n*m) for repeated individual calculations
 * @param udharChallans - Array of udhar challans
 * @param jamaChallans - Array of jama challans
 * @returns Object with both udhar and jama totals
 */
export const batchCalculateSizeTotals = (
  udharChallans: any[],
  jamaChallans: any[]
) => {
  const udharTotals = { ...EMPTY_SIZE_BALANCE };
  const jamaTotals = { ...EMPTY_SIZE_BALANCE };

  // Process udhar in single pass
  udharChallans?.forEach((challan) => {
    const items = challan.items;
    if (items) {
      for (const size of SIZES) {
        const key = `size_${size}` as keyof typeof EMPTY_SIZE_BALANCE;
        const qty = (items[`size_${size}_qty`] || 0) + (items[`size_${size}_borrowed`] || 0);
        (udharTotals as any)[key] += qty;
        (udharTotals as any).grandTotal += qty;
      }
    }
  });

  // Process jama in single pass
  jamaChallans?.forEach((challan) => {
    const items = challan.items;
    if (items) {
      for (const size of SIZES) {
        const key = `size_${size}` as keyof typeof EMPTY_SIZE_BALANCE;
        const qty = (items[`size_${size}_qty`] || 0) + (items[`size_${size}_borrowed`] || 0);
        (jamaTotals as any)[key] += qty;
        (jamaTotals as any).grandTotal += qty;
      }
    }
  });

  return { udharTotals, jamaTotals };
};

/**
 * Calculate current balance in a single pass through transactions
 * More efficient than multiple separate calculations
 */
export const calculateBalanceFromTransactions = (transactions: any[]) => {
  const balance: { [key: number]: { main: number; borrowed: number; total: number } } = {};
  for (const size of SIZES) {
    balance[size] = { main: 0, borrowed: 0, total: 0 };
  }

  transactions.forEach((transaction) => {
    const multiplier = transaction.type === 'udhar' ? 1 : -1;
    for (const size of SIZES) {
      const sizeData = transaction.sizes[size];
      if (sizeData) {
        balance[size].main += sizeData.qty * multiplier;
        balance[size].borrowed += sizeData.borrowed * multiplier;
        balance[size].total = balance[size].main + balance[size].borrowed;
      }
    }
  });

  const grandTotal = Object.values(balance).reduce((sum, s) => sum + s.total, 0);
  return { sizes: balance, grandTotal };
};

/**
 * Memoized search query parser - parses search terms once
 * Avoids repeated regex and parsing operations
 */
export const parseSearchQuery = (query: string) => {
  const trimmed = query.toLowerCase().trim();
  const num = parseInt(trimmed);
  return {
    query: trimmed,
    number: num,
    isNumeric: !isNaN(num)
  };
};

/**
 * Efficient client filter with pre-parsed search terms
 * Avoids redundant string operations and regex matching
 */
export const createClientFilter = (searchTerm: string) => {
  const parsed = parseSearchQuery(searchTerm);

  return (client: any) => {
    if (!parsed.query) return true;

    // Try numeric match first
    if (parsed.isNumeric) {
      const nicName = client.client_nic_name || '';
      const match = nicName.match(/^(\d+)/);
      if (match && parseInt(match[1]) === parsed.number) return true;
    }

    // Try text matches
    const nicLower = (client.client_nic_name || '').toLowerCase();
    const nameLower = (client.client_name || '').toLowerCase();
    const siteLower = (client.site || '').toLowerCase();

    return nicLower.includes(parsed.query) || nameLower.includes(parsed.query) || siteLower.includes(parsed.query);
  };
};

/**
 * Create a sorted comparator for clients based on sort option
 * Reduces repeated sorting logic and improves readability
 */
export const createClientComparator = (
  sortOption: string,
  ledgersMap: Map<string, any>,
  naturalSort: (a: string, b: string) => number
) => {
  return (a: any, b: any) => {
    switch (sortOption) {
      case 'nameAZ':
        return naturalSort(a.client_nic_name || '', b.client_nic_name || '');
      case 'nameZA':
        return naturalSort(b.client_nic_name || '', a.client_nic_name || '');
      case 'balanceHighLow': {
        const balanceA = ledgersMap.get(a.id)?.currentBalance.grandTotal || 0;
        const balanceB = ledgersMap.get(b.id)?.currentBalance.grandTotal || 0;
        return balanceB !== balanceA
          ? balanceB - balanceA
          : naturalSort(a.client_nic_name || '', b.client_nic_name || '');
      }
      case 'balanceLowHigh': {
        const balanceA = ledgersMap.get(a.id)?.currentBalance.grandTotal || 0;
        const balanceB = ledgersMap.get(b.id)?.currentBalance.grandTotal || 0;
        return balanceA !== balanceB
          ? balanceA - balanceB
          : naturalSort(a.client_nic_name || '', b.client_nic_name || '');
      }
      default:
        return 0;
    }
  };
};

/**
 * Debounce function for search queries to avoid excessive filtering
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Batch loader for efficient pagination with minimal re-renders
 * Loads only unloaded items in current page range
 */
export const createBatchLoader = (pageSize: number) => {
  return {
    getPageRange: (currentPage: number) => ({
      start: 0,
      end: currentPage * pageSize
    }),
    getUnloadedItems: (allItems: any[], loadedIds: Set<string>, pageRange: { start: number; end: number }) => {
      return allItems.slice(pageRange.start, pageRange.end).filter((item) => !loadedIds.has(item.id));
    }
  };
};
