import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Users,
  Loader2,
  Download
} from 'lucide-react';
import { naturalSort } from '../utils/sortingUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { supabase } from '../utils/supabase';
import { fetchClientTransactions, fetchUdharChallansForClient, fetchJamaChallansForClient } from '../utils/challanFetching';
import Navbar from '../components/Navbar';
import ClientLedgerCard from '../components/ClientLedgerCard';

import toast, { Toaster } from 'react-hot-toast';

type SortOption = 'nameAZ' | 'nameZA' | 'balanceHighLow' | 'balanceLowHigh';

interface SizeBalance {
  size_1: number;
  size_2: number;
  size_3: number;
  size_4: number;
  size_5: number;
  size_6: number;
  size_7: number;
  size_8: number;
  size_9: number;
  grandTotal: number;
}

export interface ClientBalance {
  grandTotal: number;
  sizes: { [key: string]: { main: number; borrowed: number; total: number } };
}

export interface Transaction {
  type: 'udhar' | 'jama';
  challanNumber: string;
  challanId: string;
  date: string;
  grandTotal: number;
  sizes: { [key: string]: { qty: number; borrowed: number } };
  site: string;
  driverName: string;
  items: any;
}

export interface ClientLedgerData {
  clientId: string;
  clientNicName: string;
  clientFullName: string;
  clientSite: string;
  clientPhone: string;
  totalUdhar: SizeBalance;
  totalJama: SizeBalance;
  currentBalance: ClientBalance;
  udharCount: number;
  jamaCount: number;
  transactions: Transaction[];
  transactionsLoaded?: boolean;
  is_hidden?: boolean;
}

// Skeleton Cards
const MobileSkeletonCard = memo(() => (
  <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse sm:hidden">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full"></div>
        <div>
          <div className="w-28 h-4 mb-1.5 bg-gray-200 rounded-md"></div>
          <div className="w-20 h-3 bg-gray-200 rounded-md"></div>
        </div>
      </div>
      <div className="text-right">
        <div className="w-10 h-3 mb-1 ml-auto bg-gray-200 rounded-md"></div>
        <div className="h-4 bg-gray-200 rounded-md w-14"></div>
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 bg-gray-200 rounded-full"></div>
        <div className="w-20 h-3 bg-gray-200 rounded-md"></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-gray-200 rounded-full w-14 h-7"></div>
        <div className="bg-gray-200 rounded-full w-14 h-7"></div>
        <div className="bg-gray-200 rounded-full w-7 h-7"></div>
      </div>
    </div>
  </div>
));

const DesktopSkeletonCard = memo(() => (
  <div className="hidden p-4 bg-white border border-gray-200 shadow-sm sm:block rounded-xl lg:p-6 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full lg:w-14 lg:h-14"></div>
        <div>
          <div className="w-48 h-5 mb-3 bg-gray-200 rounded-md lg:h-6"></div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
              <div className="w-56 h-3.5 bg-gray-200 rounded-md"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
              <div className="w-32 h-3.5 bg-gray-200 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-4">
        <div className="text-right">
          <div className="w-14 h-3.5 mb-1 bg-gray-200 rounded-md"></div>
          <div className="w-20 h-5 bg-gray-200 rounded-md"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-8 bg-gray-200 rounded-full"></div>
          <div className="w-20 h-8 bg-gray-200 rounded-full"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
));

const SkeletonCard = memo(() => (
  <>
    <MobileSkeletonCard />
    <DesktopSkeletonCard />
  </>
));

SkeletonCard.displayName = 'SkeletonCard';
MobileSkeletonCard.displayName = 'MobileSkeletonCard';
DesktopSkeletonCard.displayName = 'DesktopSkeletonCard';

const ITEMS_PER_PAGE = 10;

export default function ClientLedger() {
  const { language } = useLanguage();
  const t = translations[language];

  // State
  const [allClients, setAllClients] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<ClientLedgerData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('nameAZ');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Helper function to filter clients based on search query
  const getFilteredClients = useCallback((clients: any[]) => {
    // Filter out hidden clients by default in Ledger (no toggle here)
    const filtered = clients.filter(c => !c.is_hidden);

    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase().trim();

    // Try to parse the search term as a number once
    const searchNum = parseInt(query);
    const isSearchingNumber = !isNaN(searchNum);

    return filtered.filter(client => {
      // If searching for a number, try to match it against the numeric part of client_nic_name
      if (isSearchingNumber) {
        const nicName = client.client_nic_name || '';
        const nicNameMatch = nicName.match(/^(\d+)/);
        if (nicNameMatch && parseInt(nicNameMatch[1]) === searchNum) return true;
      }

      // Standard text search with cached lowercase values
      const nicLower = (client.client_nic_name || '').toLowerCase();
      const nameLower = (client.client_name || '').toLowerCase();
      const siteLower = (client.site || '').toLowerCase();

      return nicLower.includes(query) || nameLower.includes(query) || siteLower.includes(query);
    });
  }, [searchQuery]);

  // Create a ledgers map for O(1) lookup instead of O(n) find
  const ledgersMap = useMemo(() => {
    const map = new Map<string, ClientLedgerData>();
    ledgers.forEach(ledger => map.set(ledger.clientId, ledger));
    return map;
  }, [ledgers]);

  // Calculate total counts with optimized filtered clients
  const filteredClients = useMemo(() => getFilteredClients(allClients), [allClients, getFilteredClients]);

  const { filteredCount, hasMore } = useMemo(() => {
    return {
      filteredCount: filteredClients.length,
      hasMore: currentPage * ITEMS_PER_PAGE < filteredClients.length
    };
  }, [filteredClients, currentPage]);

  // Optimized size calculation with single loop
  const calculateTotalsFromChallans = useCallback((challans: any[]): SizeBalance => {
    const totals = {
      size_1: 0, size_2: 0, size_3: 0, size_4: 0, size_5: 0,
      size_6: 0, size_7: 0, size_8: 0, size_9: 0, grandTotal: 0
    } as SizeBalance;

    challans?.forEach((challan: any) => {
      const items = challan.items;
      if (items) {
        for (let size = 1; size <= 9; size++) {
          const key = `size_${size}` as keyof SizeBalance;
          const qty = (items[`size_${size}_qty`] || 0) + (items[`size_${size}_borrowed`] || 0);
          totals[key] += qty;
          totals.grandTotal += qty;
        }
      }
    });
    return totals;
  }, []);

  const transformClientToLedgerData = useCallback(async (client: any, loadTransactions = false): Promise<ClientLedgerData> => {
    let transactions: Transaction[] = [];
    let udharTotals: SizeBalance = {
      size_1: 0, size_2: 0, size_3: 0, size_4: 0, size_5: 0,
      size_6: 0, size_7: 0, size_8: 0, size_9: 0, grandTotal: 0
    };
    let jamaTotals: SizeBalance = { ...udharTotals };
    let currentBalance: ClientBalance = {
      grandTotal: 0,
      sizes: {}
    };

    // Initialize sizes - do this ALWAYS, not just when loadTransactions is true
    for (let i = 1; i <= 9; i++) {
      currentBalance.sizes[i] = { main: 0, borrowed: 0, total: 0 };
    }

    if (loadTransactions) {
      try {
        const rawTransactions = await fetchClientTransactions(client.id);

        // Process transactions with optimized calculation
        const udharList: any[] = [];
        const jamaList: any[] = [];

        transactions = rawTransactions.map((t: any) => {
          const sizes: { [key: string]: { qty: number; borrowed: number } } = {};
          let grandTotal = 0;

          for (let i = 1; i <= 9; i++) {
            const qty = t.items[`size_${i}_qty`] || 0;
            const borrowed = t.items[`size_${i}_borrowed`] || 0;
            sizes[i] = { qty, borrowed };
            grandTotal += qty + borrowed;
          }

          const transaction = {
            type: t.type,
            challanNumber: t.challanNumber,
            challanId: t.challanNumber,
            date: t.date,
            grandTotal,
            sizes,
            site: t.site,
            driverName: t.driverName || '',
            items: t.items
          };

          // Group for balance calculation
          if (t.type === 'udhar') udharList.push(transaction);
          else jamaList.push(transaction);

          return transaction;
        });

        udharTotals = calculateTotalsFromChallans(udharList);
        jamaTotals = calculateTotalsFromChallans(jamaList);

        // Calculate balance in single pass
        transactions.forEach(transaction => {
          const multiplier = transaction.type === 'udhar' ? 1 : -1;
          for (let i = 1; i <= 9; i++) {
            const size = transaction.sizes[i];
            currentBalance.sizes[i].main += size.qty * multiplier;
            currentBalance.sizes[i].borrowed += size.borrowed * multiplier;
            currentBalance.sizes[i].total = currentBalance.sizes[i].main + currentBalance.sizes[i].borrowed;
          }
        });

        currentBalance.grandTotal = Object.values(currentBalance.sizes).reduce((sum, size) => sum + size.total, 0);
      } catch (error) {
        console.error('Error loading transactions:', error);
      }
    }

    return {
      clientId: client.id,
      clientNicName: client.client_nic_name,
      clientFullName: client.client_name,
      clientSite: client.site,
      clientPhone: client.primary_phone_number,
      totalUdhar: udharTotals,
      totalJama: jamaTotals,
      currentBalance,
      udharCount: transactions.filter(t => t.type === 'udhar').length,
      jamaCount: transactions.filter(t => t.type === 'jama').length,
      transactions,
      transactionsLoaded: loadTransactions,
      is_hidden: client.is_hidden
    };
  }, [calculateTotalsFromChallans]);

  // Data fetching
  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('client_nic_name', { ascending: true });
    if (error) throw error;
    return data || [];
  }, []);

  const loadInitialData = useCallback(async (showRefreshToast = false) => {
    setLoading(true);
    setRefreshing(showRefreshToast);
    try {
      const clients = await fetchClients();
      setAllClients(clients);
      const initialBatch = clients.slice(0, ITEMS_PER_PAGE);
      const ledgerData = await Promise.all(
        initialBatch.map(client => transformClientToLedgerData(client, true))
      );
      setLedgers(ledgerData);
      setCurrentPage(1);
      if (showRefreshToast) toast.success('Ledger data refreshed successfully');
    } catch (err) {
      console.error('Error loading ledgers:', err);
      toast.error('Failed to load client ledgers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchClients, transformClientToLedgerData]);

  // Sorted clients memo
  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      // Priority based on search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const aNic = (a.client_nic_name || '').toLowerCase();
        const bNic = (b.client_nic_name || '').toLowerCase();

        // Helper to extract numeric ID
        const getID = (str: string) => {
          const m = str.match(/^(\d+)/);
          return m ? m[1] : '';
        };

        const aId = getID(aNic);
        const bId = getID(bNic);

        // Priority 1: Exact ID match
        const aExactId = aId === query;
        const bExactId = bId === query;
        if (aExactId && !bExactId) return -1;
        if (bExactId && !aExactId) return 1;

        // Priority 2: Starts with search query
        const aStarts = aNic.startsWith(query);
        const bStarts = bNic.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;
      }

      // Default sorting options
      switch (sortOption) {
        case 'nameAZ':
          return naturalSort(a.client_nic_name || '', b.client_nic_name || '');
        case 'nameZA':
          return naturalSort(b.client_nic_name || '', a.client_nic_name || '');
        case 'balanceHighLow': {
          const balanceA = ledgersMap.get(a.id)?.currentBalance.grandTotal || 0;
          const balanceB = ledgersMap.get(b.id)?.currentBalance.grandTotal || 0;
          return balanceB !== balanceA ? balanceB - balanceA : naturalSort(a.client_nic_name || '', b.client_nic_name || '');
        }
        case 'balanceLowHigh': {
          const balanceA = ledgersMap.get(a.id)?.currentBalance.grandTotal || 0;
          const balanceB = ledgersMap.get(b.id)?.currentBalance.grandTotal || 0;
          return balanceA !== balanceB ? balanceA - balanceB : naturalSort(a.client_nic_name || '', b.client_nic_name || '');
        }
        default: return 0;
      }
    });
  }, [filteredClients, sortOption, ledgersMap, searchQuery]);

  // Optimized: Load visible ledgers when needed using ledgersMap for O(1) lookups
  const loadVisibleLedgers = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const start = 0;
      const end = currentPage * ITEMS_PER_PAGE;
      // USE SORTED CLIENTS HERE
      const paginatedClients = sortedClients.slice(start, end);

      const unloadedClients = paginatedClients.filter(client => {
        const ledger = ledgersMap.get(client.id);
        return !ledger || !ledger.transactionsLoaded;
      });

      if (unloadedClients.length > 0) {
        const newLedgerData = await Promise.all(
          unloadedClients.map(client => transformClientToLedgerData(client, true))
        );
        setLedgers(prev => {
          const updated = [...prev];
          newLedgerData.forEach(newLedger => {
            const index = updated.findIndex(l => l.clientId === newLedger.clientId);
            if (index !== -1) {
              updated[index] = newLedger;
            } else {
              updated.push(newLedger);
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.error('Error loading ledgers:', err);
      toast.error('Failed to load client data');
    } finally {
      setLoadingMore(false);
    }
  }, [sortedClients, currentPage, ledgersMap, transformClientToLedgerData, loadingMore]);

  // Filtered and sorted ledgers for display - optimized with map lookup
  const filteredAndSortedLedgers = useMemo(() => {
    // Get the paginated portion from sortedClients
    const start = 0;
    const end = currentPage * ITEMS_PER_PAGE;
    const paginatedClients = sortedClients.slice(start, end);

    // Map to ledger data with optimized O(1) lookup
    const emptyBalance: ClientBalance = { grandTotal: 0, sizes: {} };
    for (let i = 1; i <= 9; i++) {
      emptyBalance.sizes[i] = { main: 0, borrowed: 0, total: 0 };
    }
    const emptySize: SizeBalance = {
      size_1: 0, size_2: 0, size_3: 0, size_4: 0, size_5: 0,
      size_6: 0, size_7: 0, size_8: 0, size_9: 0, grandTotal: 0
    };

    return paginatedClients.map(client => {
      const existingLedger = ledgersMap.get(client.id);
      if (existingLedger) return existingLedger;

      // Return placeholder if data not yet loaded
      return {
        clientId: client.id,
        clientNicName: client.client_nic_name,
        clientFullName: client.client_name,
        clientSite: client.site,
        clientPhone: client.primary_phone_number,
        totalUdhar: emptySize,
        totalJama: emptySize,
        currentBalance: emptyBalance,
        udharCount: 0,
        jamaCount: 0,
        transactions: [],
        transactionsLoaded: false
      };
    });
  }, [sortedClients, ledgersMap, currentPage]);

  // CSV Download Handler
  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      // 1. Fetch all clients
      const clients = await fetchClients();

      // 2. Fetch all transactions (udhar and jama)
      const [allUdhar, allJama] = await Promise.all([
        fetchUdharChallansForClient(),
        fetchJamaChallansForClient()
      ]);

      // 3. Process data to calculate balances for each client
      const csvRows = [['Client Sort Name', 'Client Name', 'Site', 'Phone', 'Grand Total', 'Size 1', 'Size 2', 'Size 3', 'Size 4', 'Size 5', 'Size 6', 'Size 7', 'Size 8', 'Size 9']];

      // Create maps for quick lookup
      const udharMap = new Map<string, any[]>();
      const jamaMap = new Map<string, any[]>();

      allUdhar.forEach((u: any) => {
        const cid = u.clientId;
        if (!udharMap.has(cid)) udharMap.set(cid, []);
        udharMap.get(cid)?.push(u);
      });

      allJama.forEach((j: any) => {
        const cid = j.clientId;
        if (!jamaMap.has(cid)) jamaMap.set(cid, []);
        jamaMap.get(cid)?.push(j);
      });

      // Process each client
      clients.forEach(client => {
        const clientUdhar = udharMap.get(client.id) || [];
        const clientJama = jamaMap.get(client.id) || [];

        // Calculate totals
        const udharTotals = calculateTotalsFromChallans(clientUdhar);
        const jamaTotals = calculateTotalsFromChallans(clientJama);

        // Calculate current balance (Udhar - Jama)
        const currentBalance: any = { grandTotal: 0 };
        for (let i = 1; i <= 9; i++) {
          const key = `size_${i}` as keyof SizeBalance;
          const uVal = udharTotals[key];
          const jVal = jamaTotals[key];
          currentBalance[key] = uVal - jVal;
        }
        currentBalance.grandTotal = udharTotals.grandTotal - jamaTotals.grandTotal;

        // Add row
        csvRows.push([
          `"${client.client_nic_name || ''}"`,
          `"${client.client_name || ''}"`,
          `"${client.site || ''}"`,
          `"${client.primary_phone_number || ''}"`,
          currentBalance.grandTotal.toString(),
          currentBalance.size_1.toString(),
          currentBalance.size_2.toString(),
          currentBalance.size_3.toString(),
          currentBalance.size_4.toString(),
          currentBalance.size_5.toString(),
          currentBalance.size_6.toString(),
          currentBalance.size_7.toString(),
          currentBalance.size_8.toString(),
          currentBalance.size_9.toString()
        ]);
      });

      // 4. Generate and download CSV
      const csvContent = csvRows.map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `client_ledger_backup_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Backup downloaded successfully');
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Failed to download backup');
    } finally {
      setDownloading(false);
    }
  };

  // Scroll handler for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    if (!loadingMore && hasMore && (target.scrollHeight - target.scrollTop - target.clientHeight < 100)) {
      setCurrentPage(prev => prev + 1);
    }
  }, [loadingMore, hasMore]);

  // Effects
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    loadVisibleLedgers();
  }, [loadVisibleLedgers]);

  // Get sort label
  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'nameAZ': return t.nameAZ;
      case 'nameZA': return t.nameZA;
      case 'balanceHighLow': return t.balanceHighLow;
      case 'balanceLowHigh': return t.balanceLowHigh;
      default: return '';
    }
  };

  // Click outside handler for sort menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.sort-menu-container')) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-center" toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
          fontSize: '13px',
          padding: '10px 14px'
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
      }} />
      <Navbar />
      <main
        className="flex-1 w-full ml-0 overflow-y-auto pt-14 sm:pt-0 lg:ml-64 h-[100dvh]"
        onScroll={handleScroll}
      >
        <div className="w-full h-full px-3 py-3 pb-20 mx-auto sm:px-4 sm:py-5 lg:px-8 lg:py-12 lg:pb-12 max-w-7xl">
          <div className="items-center justify-between hidden mb-6 sm:flex lg:mb-8">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">{t.clientLedger}</h1>
              <p className="mt-1 text-xs text-gray-600">{t.rentalHistory}</p>
            </div>
            <button
              onClick={() => loadInitialData(true)}
              disabled={refreshing}
              title="Refresh"
              className="p-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 touch-manipulation active:scale-95"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="relative mb-4">
            <div className="relative flex items-center w-full">
              <Search className="absolute w-4 h-4 text-gray-400 left-3" />
              <input
                type="text"
                placeholder={t.searchClients}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-28 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="absolute flex items-center gap-2 right-2">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <div className="flex items-center justify-center w-4 h-4">×</div>
                  </button>
                )}



                <div className="relative sort-menu-container flex items-center gap-2">
                  <button
                    onClick={handleDownloadBackup}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    title="Download Backup (CSV)"
                  >
                    {downloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Backup</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowSortMenu(prev => !prev)}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 rounded-md"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{getSortLabel(sortOption)}</span>
                    </button>
                    {showSortMenu && (
                      <div className="absolute right-0 z-10 w-40 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {(['nameAZ', 'nameZA', 'balanceHighLow', 'balanceLowHigh'] as SortOption[]).map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setSortOption(option);
                              setShowSortMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-xs text-left transition-colors hover:bg-gray-50 ${sortOption === option ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                              }`}
                          >
                            {getSortLabel(option)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 sm:space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : filteredAndSortedLedgers.length === 0 ? (
            <div className="p-8 text-center bg-white border border-gray-200 rounded-lg shadow-sm sm:p-12 lg:p-16 sm:rounded-xl">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-gray-100 rounded-full sm:w-14 sm:h-14 sm:mb-4 lg:w-16 lg:h-16">
                <Users className="w-6 h-6 text-gray-400 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900 sm:text-base lg:text-lg">
                {searchQuery ? t.noMatchingClients : t.noClients}
              </h3>
              <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search criteria' : 'Add clients to start tracking their rental history'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-2 mt-3 text-xs font-medium text-blue-600 transition-colors rounded-lg sm:px-4 sm:py-2 sm:mt-4 sm:text-sm hover:text-blue-700 hover:bg-blue-50 touch-manipulation active:scale-95"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4">
                {filteredAndSortedLedgers.map(ledger => (
                  <ClientLedgerCard key={ledger.clientId} ledger={ledger} />
                ))}
              </div>
              {hasMore && loadingMore && (
                <div className="flex justify-center py-4 sm:py-8">
                  <div className="flex items-center gap-2 text-xs text-gray-600 sm:text-sm">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Loading more clients...</span>
                  </div>
                </div>
              )}
              {!hasMore && filteredCount > ITEMS_PER_PAGE && (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-500">
                    You've reached the end of the list
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}