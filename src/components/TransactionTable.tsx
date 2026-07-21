import { useState, useMemo, useEffect } from 'react';
import { ArrowUpDown, Download } from 'lucide-react';
import { Transaction, ClientBalance } from '../utils/ledgerCalculations';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { generateJPEG } from '../utils/generateJPEG';
import ReceiptTemplate from './ReceiptTemplate';
import toast from 'react-hot-toast';
import { usePlateSizes } from '../hooks/usePlateSizes';
import { useSettings } from '../contexts/SettingsContext';

interface TransactionTableProps {
  transactions?: Transaction[];
  currentBalance: ClientBalance;
  clientNicName: string;
  clientFullName: string;
  clientSite: string;
  clientPhone: string;
}

export default function TransactionTable({
  transactions,
  currentBalance,
  clientNicName,
  clientFullName,
  clientSite,
  clientPhone
}: TransactionTableProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const { enableCategorySeparation, activeCategory } = useSettings();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'shuttering' | 'jack' | 'other'>(
    enableCategorySeparation && activeCategory ? (activeCategory as any) : 'all'
  );
  const { sizes: rawPlateSizes } = usePlateSizes();

  useEffect(() => {
    if (enableCategorySeparation && activeCategory) {
      setSelectedCategory(activeCategory as any);
    } else {
      setSelectedCategory('all');
    }
  }, [enableCategorySeparation, activeCategory]);

  const plateSizes = useMemo(() => {
    return rawPlateSizes.filter(size => {
      // Category filter
      if (selectedCategory !== 'all' && size.category !== selectedCategory) {
        return false;
      }
      const hasTx = transactions?.some(t => {
        const sz = t.sizes[size.id];
        return sz && ((sz.qty || 0) !== 0 || (sz.borrowed || 0) !== 0);
      });
      const bal = currentBalance?.sizes?.[size.id];
      const hasBal = bal && ((bal.main || 0) !== 0 || (bal.borrowed || 0) !== 0 || (bal.total || 0) !== 0);
      return !!(hasTx || hasBal);
    });
  }, [rawPlateSizes, transactions, currentBalance, selectedCategory]);

  const handleDownloadChallan = async (transaction: Transaction) => {
    try {
      const node = document.createElement('div');
      node.style.position = 'absolute';
      node.style.left = '-9999px';
      // Ensure the container is wide enough for 2-up layout
      node.style.width = '2450px';
      document.body.appendChild(node);

      // Create a temporary container for the receipt
      const receiptContainer = document.createElement('div');
      receiptContainer.id = 'receipt-template';
      // Set container style for 2-up layout
      receiptContainer.style.display = 'flex';
      receiptContainer.style.gap = '40px'; // Gap between receipts
      receiptContainer.style.backgroundColor = 'white';
      receiptContainer.style.padding = '0';
      node.appendChild(receiptContainer);

      // Render the receipt into the temporary container
      const receiptProps = {
        challanType: transaction.type,
        challanNumber: transaction.challanNumber,
        date: new Date(transaction.date).toLocaleDateString('en-GB'),
        clientName: clientFullName,
        clientSortName: clientNicName,
        site: transaction.site || clientSite,
        phone: clientPhone,
        driverName: transaction.driverName,
        items: transaction.items
      };

      // Render TWO copies of the receipt
      const receipt = (
        <>
          <div style={{ position: 'relative', width: '1200px', height: '1697px' }}>
            <ReceiptTemplate {...receiptProps} />
          </div>
          <div style={{ position: 'relative', width: '1200px', height: '1697px' }}>
            <ReceiptTemplate {...receiptProps} />
          </div>
        </>
      );

      // Use ReactDOM to render the receipt
      const root = await import('react-dom/client');
      const reactRoot = root.createRoot(receiptContainer);
      await new Promise<void>(resolve => {
        reactRoot.render(receipt);
        setTimeout(resolve, 500); // Increased wait time
      });

      // Generate and download the JPEG with correct dimensions
      // Width = 1200 + 1200 + 40 (gap) = 2440
      await generateJPEG(
        transaction.type as 'udhar' | 'jama',
        transaction.challanNumber.toString(),
        new Date(transaction.date).toLocaleDateString('en-GB'),
        2440,
        1697
      );

      // Clean up
      reactRoot.unmount();
      document.body.removeChild(node);
      toast.success(t.challanDownloadSuccess);
    } catch (error) {
      console.error('Error downloading challan:', error);
      toast.error(t.challanDownloadError);
    }
  };

  const sortedTransactions = transactions ? [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  }) : [];

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const formatSizeValue = (size?: { qty: number; borrowed: number; lost?: number; damaged?: number }, note?: string | null) => {
    if (!size) return '-';
    const lost = size.lost || 0;
    const damaged = size.damaged || 0;
    const total = (size.qty || 0) + (size.borrowed || 0);

    if (total === 0 && lost === 0 && damaged === 0 && !note) return '-';

    let valueDisplay = null;
    if (total > 0) {
      if ((size.borrowed || 0) === 0) {
        valueDisplay = (
          <span>
            <span className="font-medium">{size.qty}</span>
            {note && <sup className="ml-1 text-xs font-bold text-red-700">({note})</sup>}
          </span>
        );
      } else if ((size.qty || 0) === 0) {
        valueDisplay = (
          <span>
            <span className="font-bold text-red-700">{size.borrowed}</span>
            {note && <sup className="ml-1 text-xs font-bold text-red-700">({note})</sup>}
          </span>
        );
      } else {
        valueDisplay = (
          <span>
            <span className="font-medium">{(size.qty || 0) + (size.borrowed || 0)}</span>
            <sup className="ml-1 text-xs font-bold text-red-700">
              {size.borrowed}
              {note && <span>({note})</span>}
            </sup>
          </span>
        );
      }
    }

    if (!valueDisplay && note) {
      valueDisplay = <sup className="text-xs font-bold text-red-700">({note})</sup>;
    }

    return (
      <div>
        {valueDisplay || (lost > 0 || damaged > 0 ? null : '-')}
        {lost > 0 && (
          <sup className="ml-1 text-xs font-bold text-amber-600">ગુમ {lost}</sup>
        )}
        {damaged > 0 && (
          <sup className="ml-1 text-xs font-bold text-rose-600">નુકસાન {damaged}</sup>
        )}
      </div>
    );
  };

  const formatBalanceValue = (sizeBalance?: { main: number; borrowed: number; total: number }) => {
    if (!sizeBalance || sizeBalance.total === 0) return '-';

    if (sizeBalance.borrowed === 0) {
      return <span className="font-bold">{sizeBalance.main}</span>;
    }

    if (sizeBalance.main === 0) {
      return (
        <span className="font-bold text-red-700">
          {sizeBalance.borrowed}
        </span>
      );
    }

    return (
      <span>
        <span className="font-bold">{sizeBalance.main + sizeBalance.borrowed}</span>
        <sup className="ml-1 text-xs font-bold text-red-700">
          {sizeBalance.borrowed}
        </sup>
      </span>
    );
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        {t.noTransactions}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      {!enableCategorySeparation && (
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
          {(['all', 'shuttering', 'jack', 'other'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {cat === 'all' ? t.all || 'All' : t[cat] || cat}
            </button>
          ))}
        </div>
      )}

      <div className="-mx-5 overflow-x-auto md:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-gray-200 rounded-lg md:border-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:text-sm">
                  {t.challanNumber}
                </th>
                <th className="px-2 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:text-sm">
                  <button
                    onClick={toggleSort}
                    className="flex items-center gap-1 text-xs hover:text-gray-700"
                  >
                    {t.date}
                    <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </th>
                <th className="px-2 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:text-sm">
                  {t.grandTotal}
                </th>
                {plateSizes.map(size => (
                  <th key={size.id} className="px-3 py-3 text-xs font-semibold text-center text-gray-700 uppercase">
                    {size.name}
                  </th>
                ))}
                <th className="px-2 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:text-sm">
                  {t.site}
                </th>
                <th className="px-2 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase sm:text-sm">
                  {t.driver}
                </th>
                <th className="px-2 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase sm:text-sm">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="font-semibold bg-blue-50">
                <td className="px-2 py-2 text-xs whitespace-nowrap sm:text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 rounded-full"></div>
                    <span>{t.currentBalance}</span>
                  </div>
                </td>
                <td className="px-2 py-2 text-xs text-gray-500 whitespace-nowrap sm:text-sm">-</td>
                <td className="px-2 py-2 text-xs font-medium whitespace-nowrap sm:text-sm">
                  {currentBalance.grandTotal}
                </td>
                {plateSizes.map(ps => (
                  <td key={ps.id} className="px-2 py-2 text-xs text-center whitespace-nowrap sm:text-sm">
                    {formatBalanceValue(currentBalance.sizes[ps.id])}
                  </td>
                ))}
                <td className="px-2 py-2 text-xs text-gray-500 whitespace-nowrap sm:text-sm">-</td>
                <td className="px-2 py-2 text-xs text-gray-500 whitespace-nowrap sm:text-sm">-</td>
                <td className="px-2 py-2 text-xs text-gray-500 whitespace-nowrap sm:text-sm">-</td>
              </tr>

              {sortedTransactions.map((transaction, index) => (
                <tr
                  key={`${transaction.type}-${transaction.challanId}-${index}`}
                  className={transaction.type === 'udhar' ? 'bg-red-50' : 'bg-green-50'}
                >
                  <td className="px-2 py-2 text-xs whitespace-nowrap sm:text-sm">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${transaction.type === 'udhar' ? 'bg-red-500' : 'bg-green-500'
                        }`}></div>
                      <span>
                        #{transaction.challanNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-xs whitespace-nowrap sm:text-sm">
                    {new Date(transaction.date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-2 py-2 text-xs font-medium whitespace-nowrap sm:text-sm">
                    {transaction.grandTotal}
                  </td>
                  {plateSizes.map(ps => {
                    const sizeNote = (transaction.items as any)?.[`size_${ps.id}_note`] || (transaction.items as any)?.items?.[ps.id]?.note;
                    return (
                      <td key={ps.id} className="px-2 py-2 text-xs text-center sm:text-sm">
                        {formatSizeValue(transaction.sizes[ps.id], sizeNote)}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-xs whitespace-nowrap sm:text-sm">
                    {transaction.site}
                  </td>
                  <td className="px-2 py-2 text-xs whitespace-nowrap sm:text-sm">
                    {transaction.driverName || '-'}
                  </td>
                  <td className="px-2 py-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {/* Preview button removed */}
                      <button
                        onClick={() => handleDownloadChallan(transaction)}
                        className="inline-flex items-center justify-center p-1 text-blue-600 rounded hover:text-blue-800 hover:bg-blue-100"
                        title={t.downloadJPEG}
                      >
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Preview Modal removed */}
    </div>
  </div>
  );
}
