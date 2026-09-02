import { useMemo } from 'react';
import { Transaction, ClientBalance } from '../utils/ledgerCalculations';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';
import { usePlateSizes } from '../hooks/usePlateSizes';
import { useSettings } from '../contexts/SettingsContext';

interface ClientLedgerDownloadProps {
  clientNicName: string;
  clientFullName: string;
  clientSite: string;
  clientPhone: string;
  transactions: Transaction[];
  currentBalance: ClientBalance;
  elementId?: string;
  simpleMode?: boolean;
  mode?: 'simple' | 'detailed' | 'split';
}

export default function ClientLedgerDownload({
  clientNicName,
  clientFullName,
  clientSite,
  clientPhone,
  transactions,
  currentBalance,
  elementId,
  simpleMode = false,
  mode
}: ClientLedgerDownloadProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const { enableCategorySeparation, activeCategory, jackMaterialType } = useSettings();
  const { sizes: rawPlateSizes } = usePlateSizes();

  // Determine active mode
  const activeMode = mode || (simpleMode ? 'simple' : 'detailed');

  const activePlateSizes = useMemo(() => {
    return rawPlateSizes.filter(size => {
      if (enableCategorySeparation) {
        const cat = activeCategory || 'shuttering';
        if ((size.category || 'shuttering') !== cat) return false;
      }
      const hasTx = transactions?.some(t => {
        const sz = t.sizes[size.id];
        return sz && ((sz.qty || 0) !== 0 || (sz.borrowed || 0) !== 0);
      });
      const bal = currentBalance?.sizes?.[size.id];
      const hasBal = bal && ((bal.main || 0) !== 0 || (bal.borrowed || 0) !== 0 || (bal.total || 0) !== 0);
      return !!(hasTx || hasBal);
    });
  }, [rawPlateSizes, transactions, currentBalance, enableCategorySeparation, activeCategory]);

  const isJackIron = (ps: any) => ps.category === 'jack' && jackMaterialType === 'iron';

  const SIZE_INDICES: number[] = activePlateSizes.map(s => s.id);
  const PLATE_SIZES: string[] = activePlateSizes.map(s => s.name);

  const formatSizeValue = (
    size: { qty: number; borrowed: number; lost?: number; damaged?: number },
    note?: string | null,
    extraPortion?: 'inner' | 'outer' | null,
    extraQty?: number
  ) => {
    const total = (size?.qty || 0) + (size?.borrowed || 0);
    if (total === 0 && !note && (!extraQty || extraQty === 0)) return '-';

    let mainVal = null;
    if (total > 0) {
      if (size.borrowed === 0) {
        mainVal = (
          <span>
            <span className="font-medium">{size.qty}</span>
            {note && (
              <sup className="ml-1 text-[10px] font-bold text-red-700">
                ({note})
              </sup>
            )}
          </span>
        );
      } else if (size.qty === 0) {
        mainVal = (
          <span>
            <span className="font-bold text-red-700">{size.borrowed}</span>
            {note && (
              <sup className="ml-1 text-[10px] font-bold text-red-700">
                ({note})
              </sup>
            )}
          </span>
        );
      } else {
        mainVal = (
          <span>
            <span className="font-medium">{size.qty + size.borrowed}</span>
            <sup className="ml-1 text-[10px] font-bold text-red-700">
              {size.borrowed}
              {note && <span>({note})</span>}
            </sup>
          </span>
        );
      }
    } else if (note) {
      mainVal = (
        <sup className="text-[10px] font-bold text-red-700">
          ({note})
        </sup>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div>{mainVal || '-'}</div>
        {extraPortion && extraQty && extraQty > 0 ? (
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
            +{extraQty} {extraPortion === 'inner' ? (language === 'gu' ? 'ઈનર' : 'Inner') : (language === 'gu' ? 'આઉટર' : 'Outer')}
          </div>
        ) : null}
      </div>
    );
  };

  const formatBalanceValue = (sizeBalance: any, isIron: boolean = false) => {
    if (!sizeBalance) return '-';
    if (sizeBalance.total === 0 && (!sizeBalance.inner || sizeBalance.inner === 0) && (!sizeBalance.outer || sizeBalance.outer === 0)) return '-';

    let mainDisplay = null;
    if (sizeBalance.borrowed === 0) {
      mainDisplay = <span className="font-bold">{sizeBalance.main}</span>;
    } else if (sizeBalance.main === 0) {
      mainDisplay = (
        <span className="font-bold text-red-700">
          {sizeBalance.borrowed}
        </span>
      );
    } else {
      mainDisplay = (
        <span>
          <span className="font-bold">
            {sizeBalance.main + sizeBalance.borrowed}
          </span>
          <sup className="ml-1 text-[10px] font-bold text-red-700">
            {sizeBalance.borrowed}
          </sup>
        </span>
      );
    }

    if (isIron && (sizeBalance.inner !== undefined || sizeBalance.outer !== undefined)) {
      const inners = sizeBalance.inner || 0;
      const outers = sizeBalance.outer || 0;
      const pairs = sizeBalance.pairs !== undefined ? sizeBalance.pairs : Math.max(0, Math.min(inners, outers));
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#1e40af' }}>{pairs} {language === 'gu' ? 'જોડી' : 'Pairs'}</span>
          {(inners !== outers || inners !== pairs) && (
            <span style={{ fontSize: '9px', color: '#6b7280', fontWeight: 500 }}>
              {inners} I / {outers} O
            </span>
          )}
        </div>
      );
    }

    return mainDisplay;
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const udharTransactions = useMemo(() => {
    return sortedTransactions.filter(t => t.type === 'udhar');
  }, [sortedTransactions]);

  const jamaTransactions = useMemo(() => {
    return sortedTransactions.filter(t => t.type === 'jama');
  }, [sortedTransactions]);

  const udharCount = udharTransactions.length;
  const jamaCount = jamaTransactions.length;

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB');
  const formattedTime = now.toLocaleTimeString('en-GB');

  // Helper to render a transaction table (reusable for split columns)
  const renderTable = (txList: Transaction[], typeLabel: string, colorTheme: { bg: string; dot: string; headerBorder: string }) => (
    <div
      style={{
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
    >
      <div style={{ padding: '12px', borderBottom: `2px solid ${colorTheme.headerBorder}`, backgroundColor: colorTheme.bg, fontWeight: 700, fontSize: '14px' }}>
        {typeLabel}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead style={{ backgroundColor: '#f9fafb', color: '#374151', textTransform: 'uppercase', fontWeight: 700 }}>
          <tr>
            <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1.5px solid #d1d5db', minWidth: '70px' }}>ચલણ #</th>
            <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1.5px solid #d1d5db', minWidth: '80px' }}>તારીખ</th>
            <th style={{ padding: '6px 4px', textAlign: 'center', borderBottom: '1.5px solid #d1d5db', minWidth: '50px' }}>કુલ</th>
            {activeMode !== 'simple' && SIZE_INDICES.map((sizeId, idx) => (
              <th key={sizeId} style={{ padding: '6px 2px', textAlign: 'center', borderBottom: '1.5px solid #d1d5db', minWidth: '55px' }}>
                {PLATE_SIZES[idx]}
              </th>
            ))}
            <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1.5px solid #d1d5db', minWidth: '90px' }}>સાઇટ</th>
            <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1.5px solid #d1d5db', minWidth: '90px' }}>ડ્રાઇવર</th>
          </tr>
        </thead>
        <tbody>
          {txList.map((transaction, index) => {
            const rowBg = transaction.type === 'udhar' ? '#fef2f2' : '#f0fdf4';
            return (
              <tr key={`${transaction.type}-${transaction.challanId}-${index}`} style={{ backgroundColor: rowBg, borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: colorTheme.dot, display: 'inline-block' }} />
                  <span>#{transaction.challanNumber}</span>
                </td>
                <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                  {new Date(transaction.date).toLocaleDateString('en-GB')}
                </td>
                <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600 }}>
                  {transaction.grandTotal}
                </td>
                {activeMode !== 'simple' && SIZE_INDICES.map(sizeIndex => {
                  const ps = activePlateSizes.find(s => s.id === sizeIndex);
                  const itemData = (transaction.items as any)?.items?.[sizeIndex] || (transaction.items as any)?.[sizeIndex] || (Array.isArray((transaction.items as any)?.items) ? (transaction.items as any)?.items.find((i: any) => i.size_id === sizeIndex) : null);
                  const sizeNote = transaction.items?.[`size_${sizeIndex}_note`] || itemData?.note;
                  const extraPortion = itemData?.extraPortion || (transaction.items as any)?.[`size_${sizeIndex}_extraPortion`];
                  const extraQty = itemData?.extraQty || (transaction.items as any)?.[`size_${sizeIndex}_extraQty`];
                  return (
                    <td key={sizeIndex} style={{ padding: '6px 4px', textAlign: 'center' }}>
                      {formatSizeValue(transaction.sizes[sizeIndex], sizeNote, extraPortion, extraQty)}
                    </td>
                  );
                })}
                <td style={{ padding: '6px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{transaction.site}</td>
                <td style={{ padding: '6px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{transaction.driverName || '-'}</td>
              </tr>
            );
          })}
          {txList.length === 0 && (
            <tr>
              <td colSpan={6 + (activeMode !== 'simple' ? SIZE_INDICES.length : 0)} style={{ padding: '16px', textCenter: 'center', color: '#9ca3af', textAlign: 'center' }}>
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div
      id={elementId || 'client-ledger-download'}
      style={{
        width: activeMode === 'simple' ? '800px' : activeMode === 'split' ? '2000px' : '1300px',
        backgroundColor: '#ffffff',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header / title */}
      <header
        style={{
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '4px',
            }}
          >
            ગ્રાહક ખાતાવહી {activeMode === 'simple' ? '(Simple)' : activeMode === 'split' ? '(Split)' : ''}
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '2px',
            }}
          >
            {clientNicName} - {clientFullName}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#6b7280',
            }}
          >
            {clientSite} | {clientPhone}
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          <div>બનાવેલ: {formattedDate}</div>
          <div>વર્તમાન સમય: {formattedTime}</div>
        </div>
      </header>

      {/* Ledger Render Selection */}
      {activeMode === 'split' ? (
        /* Side by Side Split Format */
        <div style={{ display: 'flex', gap: '24px', width: '100%', alignItems: 'flex-start' }}>
          {/* Left Column: Jama */}
          <div style={{ flex: 1 }}>
            {renderTable(jamaTransactions, `${t.jama || 'Jama'} (Returns)`, {
              bg: '#f0fdf4',
              dot: '#16a34a',
              headerBorder: '#86efac'
            })}
          </div>

          {/* Right Column: Udhar */}
          <div style={{ flex: 1 }}>
            {renderTable(udharTransactions, `${t.udhar || 'Udhar'} (Issues)`, {
              bg: '#fef2f2',
              dot: '#dc2626',
              headerBorder: '#fca5a5'
            })}
          </div>
        </div>
      ) : (
        /* Regular Chronological Table */
        <div
          style={{
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
            }}
          >
            <thead
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              <tr>
                <th style={{ padding: '8px 8px', textAlign: 'left', minWidth: activeMode === 'simple' ? '100px' : '120px', borderBottom: '2px solid #d1d5db' }}>
                  ચલણ #
                </th>
                <th style={{ padding: '8px 8px', textAlign: 'left', minWidth: activeMode === 'simple' ? '100px' : '90px', borderBottom: '2px solid #d1d5db' }}>
                  તારીખ
                </th>
                <th style={{ padding: '8px 4px', textAlign: 'center', minWidth: activeMode === 'simple' ? '80px' : '70px', borderBottom: '2px solid #d1d5db' }}>
                  કુલ
                </th>

                {activeMode !== 'simple' && SIZE_INDICES.map((sizeIndex, idx) => (
                  <th key={sizeIndex} style={{ padding: '8px 2px', textAlign: 'center', minWidth: '70px', borderBottom: '2px solid #d1d5db' }}>
                    {PLATE_SIZES[idx]}
                  </th>
                ))}

                <th style={{ padding: '8px 8px', textAlign: 'left', minWidth: '120px', borderBottom: '2px solid #d1d5db' }}>
                  સાઇટ
                </th>
                <th style={{ padding: '8px 8px', textAlign: 'left', minWidth: '120px', borderBottom: '2px solid #d1d5db' }}>
                  ડ્રાઇવર
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Current balance row */}
              <tr style={{ backgroundColor: '#dbeafe', fontWeight: 700 }}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #d1d5db', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '9999px', backgroundColor: '#2563eb', display: 'inline-block' }} />
                  <span>વર્તમાન બાલેન્સ</span>
                </td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #d1d5db', color: '#6b7280' }}>-</td>
                <td style={{ padding: '10px 4px', borderBottom: '1px solid #d1d5db', textAlign: 'center', fontSize: '16px' }}>
                  {currentBalance.grandTotal}
                </td>

                {activeMode !== 'simple' && SIZE_INDICES.map(sizeIndex => {
                  const ps = activePlateSizes.find(s => s.id === sizeIndex);
                  return (
                    <td key={sizeIndex} style={{ padding: '10px 4px', borderBottom: '1px solid #d1d5db', textAlign: 'center' }}>
                      {formatBalanceValue(currentBalance.sizes[sizeIndex], isJackIron(ps))}
                    </td>
                  );
                })}

                <td style={{ padding: '10px 8px', borderBottom: '1px solid #d1d5db', color: '#6b7280' }}>-</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #d1d5db', color: '#6b7280' }}>-</td>
              </tr>

              {/* Transactions */}
              {sortedTransactions.map((transaction, index) => {
                const isUdhar = transaction.type === 'udhar';
                const rowBg = isUdhar ? '#fef2f2' : '#f0fdf4';
                const dotColor = isUdhar ? '#dc2626' : '#16a34a';

                return (
                  <tr key={`${transaction.type}-${transaction.challanId}-${index}`} style={{ backgroundColor: rowBg, borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 8px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '9999px', backgroundColor: dotColor, display: 'inline-block' }} />
                      <span>#{transaction.challanNumber}</span>
                    </td>
                    <td style={{ padding: '8px 8px', whiteSpace: 'nowrap' }}>
                      {new Date(transaction.date).toLocaleDateString('en-GB')}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 500 }}>
                      {transaction.grandTotal}
                    </td>

                    {activeMode !== 'simple' && SIZE_INDICES.map(sizeIndex => {
                      const ps = activePlateSizes.find(s => s.id === sizeIndex);
                      const itemData = (transaction.items as any)?.items?.[sizeIndex] || (transaction.items as any)?.[sizeIndex] || (Array.isArray((transaction.items as any)?.items) ? (transaction.items as any)?.items.find((i: any) => i.size_id === sizeIndex) : null);
                      const sizeNote = transaction.items?.[`size_${sizeIndex}_note`] || itemData?.note;
                      const extraPortion = itemData?.extraPortion || (transaction.items as any)?.[`size_${sizeIndex}_extraPortion`];
                      const extraQty = itemData?.extraQty || (transaction.items as any)?.[`size_${sizeIndex}_extraQty`];
                      return (
                        <td key={sizeIndex} style={{ padding: '8px 4px', textAlign: 'center' }}>
                          {formatSizeValue(transaction.sizes[sizeIndex], sizeNote, extraPortion, extraQty)}
                        </td>
                      );
                    })}

                    <td style={{ padding: '8px 8px' }}>{transaction.site}</td>
                    <td style={{ padding: '8px 8px' }}>{transaction.driverName || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary cards */}
      <section
        style={{
          marginTop: '24px',
          display: 'flex',
          gap: '16px',
          fontSize: '14px',
        }}
      >
        <div style={{ flex: 1, padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
          <p style={{ fontWeight: 600, color: '#b91c1c', marginBottom: '8px' }}>
            {language === 'gu' ? 'કુલ ઉધાર ચલણ' : (t.udhar || 'Udhar Challans')}
          </p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#991b1b' }}>{udharCount}</p>
        </div>

        <div style={{ flex: 1, padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
          <p style={{ fontWeight: 600, color: '#15803d', marginBottom: '8px' }}>
            {language === 'gu' ? 'કુલ જમા ચલણ' : (t.jama || 'Jama Challans')}
          </p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#166534' }}>{jamaCount}</p>
        </div>

        <div style={{ flex: 1, padding: '16px', backgroundColor: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
          <p style={{ fontWeight: 600, color: '#1e40af', marginBottom: '8px' }}>
            {language === 'gu' ? 'બાકી બેલેન્સ' : 'Pending Balance'}
          </p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#1e3a8a' }}>{currentBalance.grandTotal}</p>
        </div>
      </section>

      {/* Promotional Footer */}
      <div style={{
        textAlign: 'center',
        padding: '4px 0',
        marginTop: '40px',
        fontSize: '18px',
        fontWeight: '600',
        color: '#dc2626',
        letterSpacing: '0.5px',
        opacity: 0.6
      }}>
        કસ્ટમ બિલિંગ સોફ્ટવેર બનાવા સંપર્ક કરો - 8866471567
      </div>
    </div>
  );
}
