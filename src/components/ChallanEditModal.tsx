import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { format } from 'date-fns';
import { usePlateSizes } from '../hooks/usePlateSizes';
import { supabase } from '../utils/supabase';

interface ItemsData {
  [key: string]: any;
  main_note: string | null;
}

interface FormItems {
  [key: string]: any;
  main_note: string | null;
}

interface ChallanData {
  challanNumber: string;
  date: string;
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
  clientId?: string;
}

interface ChallanEditModalProps {
  challan: ChallanData | null;
  type: 'udhar' | 'jama';
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ChallanEditModal: React.FC<ChallanEditModalProps> = ({
  challan,
  type,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const { sizes: plateSizes } = usePlateSizes();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [alternativeSite, setAlternativeSite] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [items, setItems] = useState<FormItems>({
    main_note: null,
  });
  const [originalItems, setOriginalItems] = useState<ItemsData>({
    main_note: null,
  });

  useEffect(() => {
    if (challan && isOpen) {
      setDate(challan.date || '');
      setDriverName(challan.driverName || '');
      setDriverMobile(challan.driverMobile || '');
      setVehicleNumber(challan.vehicleNumber || '');
      setAlternativeSite(challan.isAlternativeSite ? challan.site : '');
      setSecondaryPhone(challan.isSecondaryPhone ? challan.phone : '');
      setOriginalItems(challan.items);

      const mapped: FormItems = {
        main_note: challan.items.main_note || null,
      };

      // Dynamically map all items: size_X_qty, size_X_borrowed, size_X_note
      Object.keys(challan.items).forEach((key) => {
        if (key.startsWith('size_')) {
          const val = challan.items[key];
          if (key.endsWith('_qty') || key.endsWith('_borrowed')) {
            mapped[key] = val === 0 ? null : val;
          } else {
            mapped[key] = val || null;
          }
        }
      });

      setItems(mapped);
    }
  }, [challan, isOpen]);

  if (!isOpen || !challan) return null;

  const handleItemChange = (size: number, field: 'qty' | 'borrowed' | 'note', value: string | number) => {
    setItems(prev => ({
      ...prev,
      // notes stay string|null, qty/borrowed become number|null
      [`size_${size}_${field}`]: field === 'note' ? (value === '' ? null : value) : (value === '' ? null : Number(value)),
    } as unknown as FormItems));
  };

  const handleSave = async () => {
    if (!challan?.clientId) {
      alert(t('clientIdNotFound'));
      return;
    }

    setLoading(true);
    try {
      const rpcFunction = type === 'udhar' ? 'update_udhar_challan_with_stock' : 'update_jama_challan_with_stock';
      const dateField = type === 'udhar' ? 'p_udhar_date' : 'p_jama_date';

      // Build old_items JSONB array from the flat originalItems (size_1_qty etc.)
      const oldItems: any[] = [];
      plateSizes.forEach((ps) => {
        const qty = (originalItems as any)[`size_${ps.id}_qty`] || 0;
        const borrowed = (originalItems as any)[`size_${ps.id}_borrowed`] || 0;
        const note = (originalItems as any)[`size_${ps.id}_note`] || '';
        if (qty > 0 || borrowed > 0 || note) {
          oldItems.push({ size_id: ps.id, qty, borrowed, note });
        }
      });

      // Build new_items JSONB array from the form state
      const newItems: any[] = [];
      plateSizes.forEach((ps) => {
        const qty = (items as FormItems)[`size_${ps.id}_qty` as keyof FormItems] ?? 0;
        const borrowed = (items as FormItems)[`size_${ps.id}_borrowed` as keyof FormItems] ?? 0;
        const note = (items as FormItems)[`size_${ps.id}_note` as keyof FormItems] || '';
        if ((qty as number) > 0 || (borrowed as number) > 0 || note) {
          newItems.push({ size_id: ps.id, qty: qty as number, borrowed: borrowed as number, note: note as string });
        }
      });

      const { data, error } = await supabase.rpc(rpcFunction, {
        p_challan_number: challan.challanNumber,
        p_client_id: challan.clientId,
        p_alternative_site: alternativeSite || null,
        p_secondary_phone_number: secondaryPhone || null,
        [dateField]: date,
        p_driver_name: driverName || null,
        p_driver_mobile: driverMobile || null,
        p_vehicle_number: vehicleNumber || null,
        p_old_items: oldItems,
        p_new_items: newItems,
        p_new_main_note: items.main_note,
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data) {
        if (data.success) {
          alert(t('challanUpdated'));
          onSave();
          onClose();
        } else {
          alert(`Error: ${data.message}`);
        }
      } else {
        alert(t('challanUpdated'));
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error updating challan:', error);
      alert(t('errorUpdatingChallan'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black bg-opacity-50 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-gray-200 sm:px-6 sm:py-4">
          <h2 className="flex-1 text-lg font-bold text-gray-900 sm:text-2xl">
            {t('edit')} {type === 'udhar' ? t('udharChallan') : t('jamaChallan')}
          </h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4 sm:p-6 sm:space-y-6">
          <div className="p-3 rounded-lg bg-gray-50 sm:p-4">
            <h3 className="mb-3 text-base font-semibold text-gray-900 sm:text-lg">{t('challanDetails')}</h3>
            <div className="space-y-3 sm:space-y-4">
              {/* Date and Driver Name Row */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 sm:text-sm">
                    {t('date')}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 sm:text-sm">
                    {t('driverName')}
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Driver Mobile and Vehicle Number Row */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 sm:text-sm">
                    {t('driverPhone') || 'Driver Mobile'}
                  </label>
                  <input
                    type="text"
                    value={driverMobile}
                    onChange={(e) => setDriverMobile(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 sm:text-sm">
                    {t('vehicleNumber') || 'Vehicle Number'}
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Phone Number and Site Row */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 sm:text-sm">
                    {t('secondaryPhone')}
                  </label>
                  <input
                    type="text"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 sm:text-sm">
                    {t('alternativeSite')}
                  </label>
                  <input
                    type="text"
                    value={alternativeSite}
                    onChange={(e) => setAlternativeSite(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">{t('itemsDetails')}</h3>
            
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                      {t('size')}
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                      {t('quantity')}
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                      {t('borrowedStock')}
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                      {t('note')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plateSizes.map((ps) => (
                    <tr key={ps.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {ps.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={(items as FormItems)[`size_${ps.id}_qty` as keyof FormItems] ?? ''}
                          onChange={(e) => handleItemChange(ps.id, 'qty', e.target.value)}
                          className="w-24 px-3 py-2.5 text-sm text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={(items as FormItems)[`size_${ps.id}_borrowed` as keyof FormItems] ?? ''}
                          onChange={(e) => handleItemChange(ps.id, 'borrowed', e.target.value)}
                          className="w-24 px-3 py-2.5 text-sm text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={(items as FormItems)[`size_${ps.id}_note` as keyof FormItems] || ''}
                          onChange={(e) => handleItemChange(ps.id, 'note', e.target.value)}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Layout - Horizontal Scroll Table */}
            <div className="-mx-4 md:hidden">
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                          <th className="sticky left-0 z-5 px-1 py-1.5 text-[10px] font-bold text-center text-gray-700 bg-gray-100 border-r-2 border-gray-300 w-12 sm:px-2 sm:text-xs">
                            {t('size')}
                          </th>
                          <th className="px-1 py-1.5 text-[8px] sm:text-[10px] font-semibold text-center text-gray-700 border-r border-gray-200 min-w-[60px] sm:min-w-[70px]">
                            {t('quantity')}
                          </th>
                          <th className="px-1 py-1.5 text-[8px] sm:text-[10px] font-semibold text-center text-gray-700 border-r border-gray-200 min-w-[60px] sm:min-w-[70px]">
                            {t('borrowedStock')}
                          </th>
                          <th className="px-1 py-1.5 text-[8px] sm:text-[10px] font-semibold text-center text-gray-700 min-w-[100px] sm:min-w-[120px]">
                            {t('note')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {plateSizes.map((ps, index) => (
                          <tr 
                            key={ps.id}
                            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            <td className="sticky left-0 z-5 px-1 py-1.5 text-[10px] font-bold text-center text-gray-900 border-r-2 border-gray-300 sm:px-2 sm:text-sm bg-inherit">
                              {ps.name}
                            </td>
                            <td className="px-1 py-1.5 border-r border-gray-200">
                              <input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                value={(items as FormItems)[`size_${ps.id}_qty` as keyof FormItems] ?? ''}
                                onChange={(e) => handleItemChange(ps.id, 'qty', e.target.value)}
                                className="w-full px-2 py-2 text-[13px] sm:text-sm text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] sm:min-h-[44px] touch-manipulation active:scale-[0.97]"
                              />
                            </td>
                            <td className="px-1 py-1.5 border-r border-gray-200">
                              <input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                value={(items as FormItems)[`size_${ps.id}_borrowed` as keyof FormItems] ?? ''}
                                onChange={(e) => handleItemChange(ps.id, 'borrowed', e.target.value)}
                                className="w-full px-2 py-2 text-[13px] sm:text-sm text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] sm:min-h-[44px] touch-manipulation active:scale-[0.97]"
                              />
                            </td>
                            <td className="px-1 py-1.5">
                              <input
                                type="text"
                                value={(items as FormItems)[`size_${ps.id}_note` as keyof FormItems] || ''}
                                onChange={(e) => handleItemChange(ps.id, 'note', e.target.value)}
                                className="w-full px-2 py-2 text-[13px] sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] sm:min-h-[44px] touch-manipulation active:scale-[0.97]"
                                placeholder={t('optionalNote')}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>


            <div className="mt-3 sm:mt-4">
              <label className="block mb-1 text-xs font-medium text-gray-700 sm:text-sm">
                {t('mainNote')}
              </label>
              <textarea
                value={(items as FormItems).main_note || ''}
                onChange={(e) => setItems(prev => ({ ...prev, main_note: e.target.value || null } as FormItems))}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 flex flex-col-reverse justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 sm:px-6 sm:py-4 sm:flex-row sm:gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-800 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-sm text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallanEditModal;
