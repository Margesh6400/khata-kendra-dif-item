import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Calendar, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchDailyChallans } from '../utils/challanFetching';
import { calculateTotalFromItems } from '../utils/challanFetching';
import { supabase } from '../utils/supabase';
import toast from 'react-hot-toast';

const JournalSection: React.FC = () => {
    const { t } = useLanguage();
    const [challans, setChallans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [isStockExpanded, setIsStockExpanded] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const downloadMenuRefMobile = useRef<HTMLDivElement>(null);
    const downloadMenuRefDesktop = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            const insideMobile = downloadMenuRefMobile.current?.contains(target);
            const insideDesktop = downloadMenuRefDesktop.current?.contains(target);
            if (!insideMobile && !insideDesktop) {
                setShowDownloadMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Size labels mapping (matching PLATE_SIZES from ItemsTable)
    const sizeLabels = [
        "2 X 3",
        "21 X 3",
        "18 X 3",
        "15 X 3",
        "12 X 3",
        "9 X 3",
        "પતરા",
        "2 X 2",
        "2 ફુટ"
    ];

    const getSizeLabel = (sizeIndex: number) => {
        return sizeLabels[sizeIndex - 1] || `Size ${sizeIndex}`;
    };

    const goToPreviousDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const goToNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const calculateDayEndStock = () => {
        const stock = Array(9).fill(0).map((_, i) => ({
            size: i + 1,
            udhar: 0,
            jama: 0,
            closing: 0
        }));

        challans.forEach(challan => {
            const isUdhar = challan.type === 'udhar';
            for (let i = 1; i <= 9; i++) {
                const qty = (challan.items?.[`size_${i}_qty`] || 0) +
                    (challan.items?.[`size_${i}_borrowed`] || 0);
                if (isUdhar) {
                    stock[i - 1].udhar += qty;
                } else {
                    stock[i - 1].jama += qty;
                }
            }
        });

        stock.forEach(s => {
            s.closing = s.jama - s.udhar;
        });

        return stock.filter(s => s.closing !== 0 || s.udhar > 0 || s.jama > 0);
    };

    const calculateTotals = () => {
        let totalUdhar = 0;
        let totalJama = 0;

        challans.forEach(challan => {
            const total = calculateTotalFromItems(challan.items);
            if (challan.type === 'udhar') {
                totalUdhar += total;
            } else {
                totalJama += total;
            }
        });

        return { totalUdhar, totalJama };
    };



    const buildCSVFromChallans = (challans: any[], label: string) => {
        const sizeLabelsRow = Array.from({ length: 9 }, (_, i) => getSizeLabel(i + 1)).join(',');
        let csv = `${label}\n`;
        csv += `પ્રકાર,તારીખ,ચલણ નં.,ક્લાયન્ટ ID,ક્લાયન્ટ નામ,કુલ જથ્થો,${sizeLabelsRow}\n`;

        // Group by date
        const byDate: Record<string, any[]> = {};
        challans.forEach(c => {
            const d = c.date || '';
            if (!byDate[d]) byDate[d] = [];
            byDate[d].push(c);
        });

        Object.keys(byDate).sort().forEach(date => {
            csv += `\n--- ${date} ---\n`;
            byDate[date].forEach(challan => {
                const isUdhar = challan.type === 'udhar';
                const type = isUdhar ? 'ઉધાર' : 'જમા';
                const total = calculateTotalFromItems(challan.items);
                const clientId = `"${(challan.clientNicName || '').replace(/"/g, '""')}"`;
                const clientName = `"${(challan.clientFullName || '').replace(/"/g, '""')}"`;
                const totalDisplay = `${isUdhar ? '+' : '-'}${total}`;
                const sizeCols = Array.from({ length: 9 }, (_, i) => {
                    const qty = (challan.items?.[`size_${i + 1}_qty`] || 0) + (challan.items?.[`size_${i + 1}_borrowed`] || 0);
                    if (qty === 0) return 0;
                    return isUdhar ? qty : `-${qty}`;
                }).join(',');
                csv += `${type},${date},${challan.challanNumber},${clientId},${clientName},${totalDisplay},${sizeCols}\n`;
            });
        });

        // Summary
        let totalUdhar = 0, totalJama = 0;
        challans.forEach(c => {
            const t = calculateTotalFromItems(c.items);
            if (c.type === 'udhar') totalUdhar += t;
            else totalJama += t;
        });
        const net = totalJama - totalUdhar;
        csv += `\nસારાંશ,,,કુલ ઉધાર: ${totalUdhar},કુલ જમા: ${totalJama},ચોખ્ખો ફેરફાર: ${net}\n`;
        return csv;
    };

    const downloadRangeJournal = async (days: number, label: string) => {
        setShowDownloadMenu(false);
        const toastId = toast.loading('ડાઉનલોડ થઈ રહ્યું છે...');
        try {
            const endDate = new Date(selectedDate);
            const startDate = new Date(selectedDate);
            startDate.setDate(endDate.getDate() - days + 1);
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const mapItems = (rawItems: any) => {
                const emptyItems = Object.fromEntries(
                    Array.from({ length: 9 }, (_, i) => [`size_${i + 1}_qty`, 0]
                    ).concat(Array.from({ length: 9 }, (_, i) => [`size_${i + 1}_borrowed`, 0]))
                );
                const row = Array.isArray(rawItems) ? (rawItems[0] || emptyItems) : (rawItems || emptyItems);
                return row;
            };

            const [{ data: udhar }, { data: jama }] = await Promise.all([
                supabase.from('udhar_challans').select(`
                    udhar_challan_number, udhar_date, client_id,
                    client:clients!udhar_challans_client_id_fkey(client_nic_name, client_name),
                    items:udhar_items!udhar_items_udhar_challan_number_fkey(
                        size_1_qty,size_2_qty,size_3_qty,size_4_qty,size_5_qty,size_6_qty,size_7_qty,size_8_qty,size_9_qty, size_10_qty,
                        size_1_borrowed,size_2_borrowed,size_3_borrowed,size_4_borrowed,size_5_borrowed,size_6_borrowed,size_7_borrowed,size_8_borrowed,size_9_borrowed,size_10_borrowed
                    )
                `).gte('udhar_date', startStr).lte('udhar_date', endStr).order('udhar_date', { ascending: true }),
                supabase.from('jama_challans').select(`
                    jama_challan_number, jama_date, client_id,
                    client:clients!jama_challans_client_id_fkey(client_nic_name, client_name),
                    items:jama_items!jama_items_jama_challan_number_fkey(
                        size_1_qty,size_2_qty,size_3_qty,size_4_qty,size_5_qty,size_6_qty,size_7_qty,size_8_qty,size_9_qty, size_10_qty,
                        size_1_borrowed,size_2_borrowed,size_3_borrowed,size_4_borrowed,size_5_borrowed,size_6_borrowed,size_7_borrowed,size_8_borrowed,size_9_borrowed,size_10_borrowed
                    )
                `).gte('jama_date', startStr).lte('jama_date', endStr).order('jama_date', { ascending: true }),
            ]);

            const allChallans = [
                ...(udhar || []).map((c: any) => ({ challanNumber: c.udhar_challan_number, date: c.udhar_date, type: 'udhar', clientNicName: c.client?.client_nic_name || '', clientFullName: c.client?.client_name || '', items: mapItems(c.items) })),
                ...(jama || []).map((c: any) => ({ challanNumber: c.jama_challan_number, date: c.jama_date, type: 'jama', clientNicName: c.client?.client_nic_name || '', clientFullName: c.client?.client_name || '', items: mapItems(c.items) })),
            ].sort((a, b) => a.date.localeCompare(b.date));

            const csv = buildCSVFromChallans(allChallans, `${label} (${startStr} થી ${endStr})`);
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', `journal_${label}_${startStr}_to_${endStr}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('ડાઉનલોડ થઈ ગઈ!', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('ડાઉનલોડ નિષ્ફળ!', { id: toastId });
        }
    };

    const downloadJournal = () => {
        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const totals = calculateTotals();
            const net = totals.totalJama - totals.totalUdhar;

            // Header row (no trailing comma)
            const sizeLabelsRow = Array.from({ length: 9 }, (_, i) => getSizeLabel(i + 1)).join(',');
            let csv = `પ્રકાર,ચલણ નં.,ક્લાયન્ટ ID,ક્લાયન્ટ નામ,કુલ જથ્થો,${sizeLabelsRow}\n`;

            // Data rows
            challans.forEach(challan => {
                const isUdhar = challan.type === 'udhar';
                const type = isUdhar ? 'ઉધાર' : 'જમા';
                const total = calculateTotalFromItems(challan.items);
                const clientId = `"${(challan.clientNicName || '').replace(/"/g, '""')}"`;
                const clientName = `"${(challan.clientFullName || '').replace(/"/g, '""')}"`;
                const totalDisplay = `${isUdhar ? '+' : '-'}${total}`;

                const sizeCols = Array.from({ length: 9 }, (_, i) => {
                    const qty = (challan.items?.[`size_${i + 1}_qty`] || 0) + (challan.items?.[`size_${i + 1}_borrowed`] || 0);
                    if (qty === 0) return 0;
                    return isUdhar ? qty : `-${qty}`;
                }).join(',');

                csv += `${type},${challan.challanNumber},${clientId},${clientName},${totalDisplay},${sizeCols}\n`;
            });

            // Summary — single row
            csv += `\nસારાંશ,,કુલ ઉધાર: ${totals.totalUdhar},કુલ જમા: ${totals.totalJama},ચોખ્ખો ફેરફાર: ${net}\n`;

            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', `journal_${dateStr}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('રોજમેળ ડાઉનલોડ થઈ ગઈ!');

        } catch (error) {
            console.error('Error generating CSV:', error);
            toast.error('Failed to download CSV');
        }
    };

    useEffect(() => {
        const loadChallans = async () => {
            setLoading(true);
            try {
                const data = await fetchDailyChallans(selectedDate);

                // Filter out bills, keep only udhar and jama
                const filteredData = data.filter((c: any) => c.type === 'udhar' || c.type === 'jama');

                // Sort: Udhar first, then Jama
                const sortedData = filteredData.sort((a: any, b: any) => {
                    if (a.type === 'udhar' && b.type === 'jama') return -1;
                    if (a.type === 'jama' && b.type === 'udhar') return 1;
                    return 0;
                });

                setChallans(sortedData);
            } catch (error) {
                console.error('Error loading journal challans:', error);
            } finally {
                setLoading(false);
            }
        };

        loadChallans();
    }, [selectedDate]);

    const toggleRow = (challanKey: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(challanKey)) {
            newExpanded.delete(challanKey);
        } else {
            newExpanded.add(challanKey);
        }
        setExpandedRows(newExpanded);
    };

    const getSizeDetails = (items: any) => {
        const sizes = [];
        for (let i = 1; i <= 9; i++) {
            const qty = items[`size_${i}_qty`] || 0;
            const borrowed = items[`size_${i}_borrowed`] || 0;
            const total = qty + borrowed;
            if (total > 0) {
                sizes.push({ size: i, qty, borrowed, total });
            }
        }
        return sizes;
    };

    if (loading) {
        return (
            <div className="p-3 mb-3 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-4 sm:mb-5 lg:p-6 sm:rounded-xl">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse sm:w-6 sm:h-6"></div>
                    <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 mb-3 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-4 sm:mb-5 lg:p-6 sm:rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 lg:mb-5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <BookOpen className="w-4 h-4 text-gray-700 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    <h2 className="text-base font-bold text-gray-900 sm:text-lg lg:text-2xl">{t('journal')}</h2>
                </div>

                {/* Date Navigation Controls */}
                <div className="flex items-center gap-2 ml-auto">
                    {/* Date Picker */}
                    <input
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm sm:px-3 sm:py-1.5 sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Up/Down Arrow Buttons - Side by Side */}
                    <div className="flex flex-row gap-0.5">
                        {/* Previous Day Button (Down Arrow) */}
                        <button
                            onClick={goToPreviousDay}
                            className="p-1 text-gray-600 bg-white border border-gray-300 rounded-l-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Previous day"
                        >
                            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>

                        {/* Next Day Button (Up Arrow) */}
                        <button
                            onClick={goToNextDay}
                            className="p-1 text-gray-600 bg-white border border-gray-300 rounded-r-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Next day"
                        >
                            <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {challans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                    <Calendar className="w-10 h-10 mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">{t('noJournalEntries')}</p>
                </div>
            ) : (
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sm:px-3 sm:py-3 sm:text-sm">
                                        {t('totalStock')}
                                    </th>
                                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sm:px-3 sm:py-3 sm:text-sm">
                                        {t('challanNumber')}
                                    </th>
                                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sm:px-3 sm:py-3 sm:text-sm">
                                        {t('client')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {challans.map((challan) => {
                                    const totalStock = calculateTotalFromItems(challan.items);
                                    const isUdhar = challan.type === 'udhar';
                                    const challanKey = `${challan.type}-${challan.challanNumber}`;
                                    const isExpanded = expandedRows.has(challanKey);
                                    const sizeDetails = getSizeDetails(challan.items);

                                    return (
                                        <React.Fragment key={challanKey}>
                                            <tr
                                                onClick={() => toggleRow(challanKey)}
                                                className={`transition-colors cursor-pointer ${isUdhar
                                                    ? 'bg-red-50 hover:bg-red-100'
                                                    : 'bg-green-50 hover:bg-green-100'
                                                    }`}
                                            >
                                                {/* Total Stock Column */}
                                                <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold sm:text-sm ${isUdhar
                                                            ? 'bg-red-600 text-white'
                                                            : 'bg-green-600 text-white'
                                                            }`}>
                                                            {isUdhar ? '+' : '-'}{totalStock}
                                                        </span>
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-4 h-4 text-gray-500" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Challan Number Column */}
                                                <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-sm font-bold sm:text-base ${isUdhar ? 'text-red-700' : 'text-green-700'
                                                            }`}>
                                                            #{challan.challanNumber}
                                                        </span>
                                                        <span className={`text-[10px] font-medium uppercase tracking-wide sm:text-xs ${isUdhar ? 'text-red-600' : 'text-green-600'
                                                            }`}>
                                                            {isUdhar ? t('udhar') : t('jama')}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Client Column */}
                                                <td className="px-2 py-2 sm:px-3 sm:py-3 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-bold text-gray-900 sm:text-base line-clamp-1">
                                                            {challan.clientNicName}
                                                        </span>
                                                        <span className="text-xs text-gray-600 sm:text-sm line-clamp-1">
                                                            {challan.clientFullName}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded Row - Size Details */}
                                            {isExpanded && (
                                                <tr className={isUdhar ? 'bg-red-100' : 'bg-green-100'}>
                                                    <td colSpan={3} className="px-2 py-3 sm:px-4 sm:py-4">
                                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                                            {sizeDetails.map((detail) => (
                                                                <div
                                                                    key={detail.size}
                                                                    className="p-2 bg-white rounded-lg shadow-sm border border-gray-200"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs font-semibold text-gray-700 sm:text-sm">
                                                                            {getSizeLabel(detail.size)}
                                                                        </span>
                                                                        <span className={`text-xs font-bold sm:text-sm ${isUdhar ? 'text-red-600' : 'text-green-600'}`}>
                                                                            {detail.total}
                                                                        </span>
                                                                    </div>
                                                                    {detail.borrowed > 0 && (
                                                                        <div className="mt-1 text-[10px] text-gray-500 sm:text-xs">
                                                                            {t('mainStock')}: {detail.qty} | {t('borrowed')}: {detail.borrowed}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Day-End Summary Section */}
            {challans.length > 0 && (
                <div className="mt-4 space-y-3 sm:mt-6">
                    {/* Collapsible Stock Inventory */}
                    <div className="overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                        {/* Header - Clickable to expand/collapse */}
                        <button
                            onClick={() => setIsStockExpanded(!isStockExpanded)}
                            className="flex items-center justify-between w-full p-3 text-left transition-colors hover:bg-gray-100 sm:p-4"
                        >
                            <h3 className="text-sm font-semibold text-gray-800 sm:text-base">
                                📊 {t('endOfDayStock') || 'End of Day Stock'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">
                                    {isStockExpanded ? (t('hide') || 'Hide') : (t('show') || 'Show')}
                                </span>
                                {isStockExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-600" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                )}
                            </div>
                        </button>

                        {/* Expandable Content */}
                        {isStockExpanded && (
                            <div className="p-3 pt-0 sm:p-4 sm:pt-0">
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                                    {calculateDayEndStock().map(stock => (
                                        <div key={stock.size} className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm sm:p-3">
                                            <div className="text-xs font-medium text-gray-600 mb-1">
                                                {getSizeLabel(stock.size)}
                                            </div>
                                            <div className="text-xl font-bold text-gray-900 sm:text-2xl">
                                                {stock.closing}
                                            </div>
                                            <div className="mt-1 text-[10px] text-gray-500 sm:text-xs">
                                                <span className="text-red-600">-{stock.udhar}</span>
                                                {' | '}
                                                <span className="text-green-600">+{stock.jama}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Compact Summary Row for Mobile - All in One Line */}
                    <div className="sm:hidden">
                        {/* Single Row with All Summary Info */}
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {/* Final Stock */}
                            <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                                <div className="text-[10px] font-medium text-blue-700 mb-0.5">
                                    📈 {t('finalStock') || 'Final'}
                                </div>
                                <div className="text-xl font-bold text-blue-900">
                                    {calculateTotals().totalJama - calculateTotals().totalUdhar}
                                </div>
                            </div>

                            {/* Total Udhar */}
                            <div className="p-2 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                                <div className="text-[10px] font-medium text-red-700 mb-0.5">
                                    📤 {t('udhar') || 'Udhar'}
                                </div>
                                <div className="text-xl font-bold text-red-800">
                                    {calculateTotals().totalUdhar}
                                </div>
                            </div>

                            {/* Total Jama */}
                            <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                                <div className="text-[10px] font-medium text-green-700 mb-0.5">
                                    📥 {t('jama') || 'Jama'}
                                </div>
                                <div className="text-xl font-bold text-green-800">
                                    {calculateTotals().totalJama}
                                </div>
                            </div>
                        </div>

                        {/* Download Buttons - Mobile */}
                        <div className="relative" ref={downloadMenuRefMobile}>
                            <div className="flex">
                                <button
                                    onClick={downloadJournal}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-l-lg shadow-md active:scale-95 transition-all"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span className="text-sm">રોજમેળ ડાઉનલોડ</span>
                                </button>
                                <button
                                    onClick={() => setShowDownloadMenu(v => !v)}
                                    className="px-3 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-r-lg border-l border-blue-500 transition-all"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>
                            {showDownloadMenu && (
                                <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {[
                                        { label: 'છેલ્લા ૭ દિવસ', days: 7 },
                                        { label: 'છેલ્લા ૧૫ દિવસ', days: 15 },
                                        { label: 'છેલ્લો મહિનો', days: 30 },
                                    ].map(opt => (
                                        <button
                                            key={opt.days}
                                            onClick={() => downloadRangeJournal(opt.days, opt.label)}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                                        >
                                            <FileText className="w-4 h-4 text-blue-500" />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Desktop Layout - Original */}
                    <div className="hidden sm:flex sm:flex-col sm:gap-3 sm:items-center sm:justify-between lg:flex-row">
                        <div className="flex gap-3">
                            {/* Total Udhar */}
                            <div className="flex-1 px-4 py-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200 sm:flex-none">
                                <div className="text-xs font-medium text-red-700 mb-1 sm:text-sm">
                                    📤 {t('totalUdhar') || 'Total Udhar'}
                                </div>
                                <div className="text-2xl font-bold text-red-800 sm:text-3xl">
                                    {calculateTotals().totalUdhar}
                                </div>
                            </div>

                            {/* Total Jama */}
                            <div className="flex-1 px-4 py-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200 sm:flex-none">
                                <div className="text-xs font-medium text-green-700 mb-1 sm:text-sm">
                                    📥 {t('totalJama') || 'Total Jama'}
                                </div>
                                <div className="text-2xl font-bold text-green-800 sm:text-3xl">
                                    {calculateTotals().totalJama}
                                </div>
                            </div>
                        </div>

                        {/* Download Buttons - Desktop */}
                        <div className="relative" ref={downloadMenuRefDesktop}>
                            <div className="flex">
                                <button
                                    onClick={downloadJournal}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-l-lg shadow-md hover:from-blue-700 hover:to-blue-800 active:scale-95 transition-all"
                                >
                                    <FileText className="w-5 h-5" />
                                    <span className="text-base">રોજમેળ ડાઉનલોડ</span>
                                </button>
                                <button
                                    onClick={() => setShowDownloadMenu(v => !v)}
                                    className="px-3 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-r-lg border-l border-blue-500 transition-all"
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            </div>
                            {showDownloadMenu && (
                                <div className="absolute bottom-full mb-1 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[200px]">
                                    {[
                                        { label: 'છેલ્લા ૭ દિવસ', days: 7 },
                                        { label: 'છેલ્લા ૧૫ દિવસ', days: 15 },
                                        { label: 'છેલ્લો મહિનો', days: 30 },
                                    ].map(opt => (
                                        <button
                                            key={opt.days}
                                            onClick={() => downloadRangeJournal(opt.days, opt.label)}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                                        >
                                            <FileText className="w-4 h-4 text-blue-500" />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}



        </div>
    );
};

export default JournalSection;

