import React, { useState, useEffect } from 'react';
import { Package, Calendar, MapPin, ArrowUpRight, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchDailyChallans } from '../utils/challanFetching';
import { useNavigate } from 'react-router-dom';
import ChallanDetailsModal from './ChallanDetailsModal';
import { generateJPEG } from '../utils/generateJPEG';
import ReceiptTemplate from './ReceiptTemplate';
import toast from 'react-hot-toast';

const TodayChallans: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [challans, setChallans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedChallan, setSelectedChallan] = useState<any | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

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

    useEffect(() => {
        const loadChallans = async () => {
            setLoading(true);
            try {
                const data = await fetchDailyChallans(selectedDate);
                setChallans(data);
            } catch (error) {
                console.error('Error loading daily challans:', error);
            } finally {
                setLoading(false);
            }
        };

        loadChallans();
    }, [selectedDate]);

    const handleViewDetails = (challan: any) => {
        setSelectedChallan(challan);
        setShowDetailsModal(true);
    };

    const transformItems = (items: any) => {
        return {
            ...items,
            size_1_note: items.size_1_note || '',
            size_2_note: items.size_2_note || '',
            size_3_note: items.size_3_note || '',
            size_4_note: items.size_4_note || '',
            size_5_note: items.size_5_note || '',
            size_6_note: items.size_6_note || '',
            size_7_note: items.size_7_note || '',
            size_8_note: items.size_8_note || '',
            size_9_note: items.size_9_note || '', size_10_note: items.size_10_note || '',
            main_note: items.main_note || ''
        };
    };

    const handleDownloadJPEG = async (challan: any) => {
        const loadingToast = toast.loading('Generating JPEG...');
        try {
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            document.body.appendChild(container);

            const root = await import('react-dom/client');
            const reactRoot = root.createRoot(container);

            await new Promise<void>((resolve) => {
                reactRoot.render(
                    <ReceiptTemplate
                        challanType={challan.type}
                        challanNumber={challan.challanNumber}
                        date={new Date(challan.date).toLocaleDateString('en-GB')}
                        clientName={challan.clientFullName}
                        clientSortName={challan.clientNicName}
                        site={challan.site}
                        phone={challan.phone}
                        driverName={challan.driverName || ''}
                        items={transformItems(challan.items)}
                    />
                );
                setTimeout(resolve, 100);
            });

            await generateJPEG(
                challan.type,
                challan.challanNumber,
                new Date(challan.date).toLocaleDateString('en-GB')
            );

            reactRoot.unmount();
            document.body.removeChild(container);

            toast.dismiss(loadingToast);
            toast.success(t('challanDownloadSuccess'));
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('Error generating JPEG:', error);
            toast.error(t('challanDownloadError'));
        }
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    if (loading) {
        return (
            <div className="p-3 mb-3 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-4 sm:mb-5 lg:p-6 sm:rounded-xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-40 h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="p-3 border rounded-lg animate-pulse">
                            <div className="w-24 h-5 mb-2 bg-gray-200 rounded"></div>
                            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-3 sm:mb-5 lg:mb-8">
                <div className="flex flex-col gap-2 mb-2.5 sm:flex-row sm:items-center sm:justify-between sm:mb-4 lg:mb-6">
                    <div className="flex items-center justify-between w-full sm:justify-start sm:gap-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <Calendar className="w-4 h-4 text-gray-700 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                            <h2 className="text-lg font-bold text-gray-900 sm:text-xl md:text-2xl">
                                {isToday(selectedDate)
                                    ? (t('todayActivity') || "Today's Activity")
                                    : (t('activityOn' as any) || 'Activity:') + ` ${selectedDate.toLocaleDateString()}`
                                }
                            </h2>
                        </div>
                        {/* Mobile Compact Date Picker with Arrows */}
                        <div className="flex items-center gap-0.5 sm:hidden">
                            <input
                                type="date"
                                value={selectedDate.toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {/* Arrow Buttons */}
                            <div className="flex flex-row gap-0.5">
                                <button
                                    onClick={goToPreviousDay}
                                    className="p-1 text-gray-600 bg-white border border-gray-300 rounded-l-lg shadow-sm hover:bg-gray-50"
                                    aria-label="Previous day"
                                >
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={goToNextDay}
                                    className="p-1 text-gray-600 bg-white border border-gray-300 rounded-r-lg shadow-sm hover:bg-gray-50"
                                    aria-label="Next day"
                                >
                                    <ChevronUp className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                        {/* Desktop Date Picker with Arrows */}
                        <div className="hidden sm:flex sm:items-center sm:gap-0.5">
                            <input
                                type="date"
                                value={selectedDate.toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {/* Arrow Buttons */}
                            <div className="flex flex-row gap-0.5">
                                <button
                                    onClick={goToPreviousDay}
                                    className="p-1 text-gray-600 bg-white border border-gray-300 rounded-l-lg shadow-sm hover:bg-gray-50"
                                    aria-label="Previous day"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={goToNextDay}
                                    className="p-1 text-gray-600 bg-white border border-gray-300 rounded-r-lg shadow-sm hover:bg-gray-50"
                                    aria-label="Next day"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {challans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                        <Calendar className="w-12 h-12 mb-3 text-gray-300" />
                        <p className="text-base font-medium text-gray-500">
                            {t('noActivityFound') || 'No activity found based on current active filter'}
                        </p>
                        {!isToday(selectedDate) && (
                            <button
                                onClick={() => setSelectedDate(new Date())}
                                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                            >
                                Show Today
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {challans.map((challan) => (
                            <div
                                key={`${challan.type}-${challan.challanNumber}`}
                                onClick={() => challan.type === 'bill' ? navigate('/bill-book') : handleViewDetails(challan)}
                                className={`relative overflow-hidden p-3 border shadow-sm rounded-lg transition-all active:scale-[0.98] touch-manipulation cursor-pointer ${challan.type === 'udhar'
                                    ? 'bg-red-50 border-red-100'
                                    : challan.type === 'jama'
                                        ? 'bg-green-50 border-green-100'
                                        : 'bg-blue-50 border-blue-100' // Bills
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-md font-bold text-xs text-white shadow-sm ${challan.type === 'udhar'
                                            ? 'bg-gradient-to-r from-red-600 to-red-500'
                                            : challan.type === 'jama'
                                                ? 'bg-gradient-to-r from-green-600 to-green-500'
                                                : 'bg-gradient-to-r from-blue-600 to-blue-500'
                                            }`}>
                                            #{challan.challanNumber}
                                        </span>
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${challan.type === 'udhar' ? 'text-red-600'
                                            : challan.type === 'jama' ? 'text-green-600' : 'text-blue-600'
                                            }`}>
                                            {challan.type === 'udhar' ? t('udhar') : challan.type === 'jama' ? t('jama') : t('bill' as any) || 'Bill'}
                                        </span>
                                    </div>

                                    {/* Item Count or Amount */}
                                    {challan.type === 'bill' ? (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border bg-white text-blue-700 border-blue-100">
                                            <Receipt className="w-3 h-3" />
                                            ₹{(challan.amount || 0).toLocaleString('en-IN')}
                                        </span>
                                    ) : (
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${challan.type === 'udhar'
                                            ? 'bg-white text-red-700 border-red-100'
                                            : 'bg-white text-green-700 border-green-100'
                                            }`}>
                                            <Package className="w-3 h-3" />
                                            {challan.totalItems}
                                        </span>
                                    )}
                                </div>

                                {/* Client Info */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start">
                                        <span className="text-base font-bold text-gray-900 line-clamp-1 flex-1">{challan.clientNicName}</span>
                                        <div className="flex items-center gap-1 text-gray-500 shrink-0 ml-2 pt-1">
                                            <MapPin className="w-3 h-3" />
                                            <span className="text-xs font-medium truncate max-w-[100px]">{challan.site}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 line-clamp-1">{challan.clientFullName}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ChallanDetailsModal
                challan={selectedChallan}
                type={selectedChallan?.type || 'udhar'}
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                onDownload={handleDownloadJPEG}
            />
        </>
    );
};

export default TodayChallans;
