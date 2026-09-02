import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../utils/translations';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  challanNumber: string;
  totalQty: number;
  totalBorrowed: number;
  isDeleting?: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  challanNumber,
  totalQty,
  totalBorrowed,
  isDeleting = false,
}) => {
  const { language } = useLanguage();
  const t = translations[language];

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t.delete} {t.challanNumber}?
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              {t.confirmDelete}
              <br />
              <span className="font-semibold">{challanNumber}</span>
            </p>

            {(totalQty > 0 || totalBorrowed > 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  {t.stockAdjustment}:
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  {totalQty > 0 && (
                    <li>
                      {t.onRent}: -{totalQty}
                    </li>
                  )}
                  {totalBorrowed > 0 && (
                    <li>
                      {t.borrowed}: -{totalBorrowed}
                    </li>
                  )}
                </ul>
              </div>
            )}

            <p className="text-sm text-red-600 font-medium mb-6">
              {t.deleteWarning}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? language === 'gu' ? 'ડિલીટ થઈ રહ્યું છે...' : 'Deleting...' : t.delete}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
