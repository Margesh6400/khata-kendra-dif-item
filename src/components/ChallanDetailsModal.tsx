import React from 'react';
import { X, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { format } from 'date-fns';
import { usePlateSizes } from '../hooks/usePlateSizes';

interface ItemsData {
  [key: string]: any;
  main_note: string | null;
}

interface ChallanData {
  challanNumber: string;
  date: string;
  createdAt?: string;
  clientNicName: string;
  clientFullName: string;
  site: string;
  phone: string;
  driverName: string | null;
  driverMobile?: string | null;
  vehicleNumber?: string | null;
  isAlternativeSite: boolean;
  isSecondaryPhone: boolean;
  items: ItemsData;
  totalItems: number;
}

interface ChallanDetailsModalProps {
  challan: ChallanData | null;
  type: 'udhar' | 'jama';
  isOpen: boolean;
  onClose: () => void;
  onDownload: (challan: ChallanData) => void;
}

const ChallanDetailsModal: React.FC<ChallanDetailsModalProps> = ({
  challan,
  type,
  isOpen,
  onClose,
  onDownload,
}) => {
  const { t } = useLanguage();
  const { sizes: plateSizes } = usePlateSizes();

  React.useEffect(() => {
    if (isOpen && challan) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, challan]);

  if (!isOpen || !challan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-3 md:px-6 py-2 md:py-4 bg-white border-b border-gray-200">
          <h2 className="text-sm md:text-2xl font-bold text-gray-900">
            {type === 'udhar' ? t('udharChallan') : t('jamaChallan')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Challan Info - Smaller for Mobile */}
          <div className="p-3 md:p-4 rounded-lg bg-gray-50">
            <h3 className="mb-2 text-xs md:text-lg font-semibold text-gray-900">{t('challanInfo')}</h3>
            {/* Mobile: One Line */}
            <div className="md:hidden flex gap-4 text-[10px]">
              <div className="flex-1">
                <p className="text-gray-600">{t('challanNumber')}</p>
                <p className="font-medium text-gray-900">{challan.challanNumber}</p>
              </div>
              <div className="flex-1">
                <p className="text-gray-600">{t('date')}</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(challan.date), 'dd/MM/yyyy')}
                  {challan.createdAt && (
                    <span className="ml-1 text-[8px] text-gray-500">
                      ({format(new Date(challan.createdAt), 'hh:mm a')})
                    </span>
                  )}
                </p>
              </div>
            </div>
            {/* Desktop: Grid */}
            <div className="hidden gap-2 md:gap-4 md:grid md:grid-cols-2">
              <div>
                <p className="text-[10px] md:text-sm text-gray-600">{t('challanNumber')}</p>
                <p className="text-xs md:text-base font-medium text-gray-900">{challan.challanNumber}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-sm text-gray-600">{t('date')}</p>
                <p className="text-xs md:text-base font-medium text-gray-900">
                  {format(new Date(challan.date), 'dd/MM/yyyy')}
                  {challan.createdAt && (
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      {format(new Date(challan.createdAt), 'hh:mm a')}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Client Info - Hidden on Mobile */}
          {/* Client Info */}
          <div className="p-3 md:p-4 rounded-lg bg-blue-50">
            <h3 className="mb-2 text-xs md:text-lg font-semibold text-gray-900">{t('clientInfo')}</h3>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div>
                <p className="text-[10px] md:text-sm text-gray-600">{t('clientNicName')}</p>
                <p className="text-xs md:text-base font-medium text-gray-900">{challan.clientNicName}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-sm text-gray-600">{t('clientName')}</p>
                <p className="text-xs md:text-base font-medium text-gray-900">{challan.clientFullName}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-sm text-gray-600">{t('site')}</p>
                <p className="text-xs md:text-base font-medium text-gray-900">
                  {challan.site}
                  {challan.isAlternativeSite && (
                    <span className="px-1.5 py-0.5 ml-1 text-[9px] md:text-xs text-blue-800 bg-blue-200 rounded">
                      {t('alternative')}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] md:text-sm text-gray-600">{t('phone')}</p>
                <p className="text-xs md:text-base font-medium text-gray-900">
                  {challan.phone}
                  {challan.isSecondaryPhone && (
                    <span className="px-1.5 py-0.5 ml-1 text-[9px] md:text-xs text-blue-800 bg-blue-200 rounded">
                      {t('alternative')}
                    </span>
                  )}
                </p>
              </div>
              {challan.driverName && (
                <div>
                  <p className="text-[10px] md:text-sm text-gray-600">{t('driver')}</p>
                  <p className="text-xs md:text-base font-medium text-gray-900">{challan.driverName}</p>
                </div>
              )}
              {challan.driverMobile && (
                <div>
                  <p className="text-[10px] md:text-sm text-gray-600">{t('driverPhone') || 'Driver Mobile'}</p>
                  <p className="text-xs md:text-base font-medium text-gray-900">{challan.driverMobile}</p>
                </div>
              )}
              {challan.vehicleNumber && (
                <div className="col-span-2 md:col-span-1">
                  <p className="text-[10px] md:text-sm text-gray-600">{t('vehicleNumber') || 'Vehicle Number'}</p>
                  <p className="text-xs md:text-base font-medium text-gray-900">{challan.vehicleNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="p-3 md:p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="mb-2 md:mb-3 text-xs md:text-lg font-semibold text-gray-900">{t('items')}</h3>

            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 z-10 px-2 py-2 text-[10px] sm:text-xs font-medium text-left text-gray-500 uppercase bg-gray-50 sm:px-4">
                      {t('size')}
                    </th>
                    <th className="px-2 py-2 text-[10px] sm:text-xs font-medium text-center text-gray-500 uppercase sm:px-4">
                      {t('quantity')}
                    </th>
                    <th className="px-2 py-2 text-[10px] sm:text-xs font-medium text-center text-gray-500 uppercase sm:px-4">
                      {t('borrowedStock')}
                    </th>
                    <th className="px-2 py-2 text-[10px] sm:text-xs font-medium text-left text-gray-500 uppercase sm:px-4">
                      {t('note')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plateSizes.map((ps) => {
                    const qty = challan.items[`size_${ps.id}_qty` as keyof ItemsData] || 0;
                    const borrowed = challan.items[`size_${ps.id}_borrowed` as keyof ItemsData] || 0;
                    const note = challan.items[`size_${ps.id}_note` as keyof ItemsData] || '';

                    if (qty === 0 && borrowed === 0 && !note) return null;

                    return (
                      <tr key={ps.id} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-10 px-2 py-2 text-[11px] sm:text-sm font-medium text-gray-900 whitespace-nowrap bg-inherit sm:px-4">
                          {ps.name}
                        </td>
                        <td className="px-2 py-2 text-[11px] sm:text-sm text-gray-900 whitespace-nowrap text-center sm:px-4">
                          <span className="inline-block min-w-[40px] px-2 py-1 bg-blue-50 rounded">
                            {qty}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-[11px] sm:text-sm text-gray-900 whitespace-nowrap text-center sm:px-4">
                          <span className="inline-block min-w-[40px] px-2 py-1 bg-orange-50 rounded">
                            {borrowed}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-[11px] sm:text-sm text-gray-600 sm:px-4">
                          {note || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Table View - Compact */}
            <div className="md:hidden overflow-x-auto -mx-4 sm:-mx-0">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="sticky left-0 z-10 px-2 py-1.5 text-[10px] font-semibold text-left text-gray-700 bg-gray-100 border-r border-gray-300">
                      {t('size')}
                    </th>
                    <th className="px-2 py-1.5 text-[10px] font-semibold text-center text-gray-700 border-r border-gray-300">
                      {t('quantity')}
                    </th>
                    <th className="px-2 py-1.5 text-[10px] font-semibold text-center text-gray-700 border-r border-gray-300">
                      {t('borrowedStock')}
                    </th>
                    <th className="px-2 py-1.5 text-[10px] font-semibold text-left text-gray-700">
                      {t('note')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plateSizes.map((ps) => {
                    const qty = challan.items[`size_${ps.id}_qty` as keyof ItemsData] || 0;
                    const borrowed = challan.items[`size_${ps.id}_borrowed` as keyof ItemsData] || 0;
                    const note = challan.items[`size_${ps.id}_note` as keyof ItemsData] || '';

                    if (qty === 0 && borrowed === 0 && !note) return null;

                    return (
                      <tr key={ps.id} className="border-b border-gray-200">
                        <td className="sticky left-0 z-10 px-2 py-1.5 text-[10px] font-medium text-gray-900 whitespace-nowrap bg-inherit border-r border-gray-200">
                          {ps.name}
                        </td>
                        <td className="px-2 py-1.5 text-[10px] text-center text-gray-900 whitespace-nowrap border-r border-gray-200">
                          <span className="inline-block min-w-[28px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-semibold">
                            {qty}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-[10px] text-center text-gray-900 whitespace-nowrap border-r border-gray-200">
                          <span className="inline-block min-w-[28px] px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-[9px] font-semibold">
                            {borrowed}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-[9px] text-gray-600 max-w-[100px] truncate">
                          {note || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {challan.items.main_note && (
              <div className="p-3 mt-4 border border-yellow-200 rounded bg-yellow-50">
                <p className="text-sm font-semibold text-gray-700">{t('mainNote')}:</p>
                <p className="mt-1 text-sm text-gray-900">{challan.items.main_note}</p>
              </div>
            )}

            <div className="mt-2 md:mt-4 text-right">
              <p className="text-xs md:text-lg font-semibold text-gray-900">
                {t('totalItems')}: {challan.totalItems} {t('pieces')}
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => onDownload(challan)}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Download size={16} className="md:w-5 md:h-5" />
            {t('downloadJPEG')}
          </button>
          <button
            onClick={onClose}
            className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm text-gray-800 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallanDetailsModal;
