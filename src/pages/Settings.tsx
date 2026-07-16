import React from 'react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { Settings as SettingsIcon, Globe, Layers, CheckCircle, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const {
    dateSortingMethod,
    setDateSortingMethod,
    defaultLedgerDownloadFormat,
    setDefaultLedgerDownloadFormat
  } = useSettings();

  const handleSave = () => {
    toast.success(t('settingsSaved') || 'Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 w-full px-4 py-8 pb-24 sm:px-6 lg:px-8 lg:ml-64 transition-all duration-200">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <SettingsIcon className="w-6 h-6 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
              <p className="text-xs sm:text-sm text-gray-500">{t('settingsSubtitle')}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-1">
            {/* Bill Calculation Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {t('billCalculationSettings')}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('dateSortingMethod')}
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    
                    {/* Standard Method Option */}
                    <button
                      onClick={() => setDateSortingMethod('standard')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        dateSortingMethod === 'standard'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('standardSorting')}
                        </span>
                        {dateSortingMethod === 'standard' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {t('standardSortingDesc')}
                      </p>
                    </button>

                    {/* Jama First Option */}
                    <button
                      onClick={() => setDateSortingMethod('jamaFirst')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        dateSortingMethod === 'jamaFirst'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('jamaFirstSorting')}
                        </span>
                        {dateSortingMethod === 'jamaFirst' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {t('jamaFirstSortingDesc')}
                      </p>
                    </button>

                  </div>
                </div>
              </div>
            </div>

            {/* Ledger Download Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Download className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {t('ledgerDownloadSettings')}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('defaultLedgerDownloadFormat')}
                  </label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    
                    {/* Detailed Option */}
                    <button
                      onClick={() => setDefaultLedgerDownloadFormat('detailed')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        defaultLedgerDownloadFormat === 'detailed'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('detailed')}
                        </span>
                        {defaultLedgerDownloadFormat === 'detailed' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {t('detailedFormatDesc')}
                      </p>
                    </button>

                    {/* Simple Option */}
                    <button
                      onClick={() => setDefaultLedgerDownloadFormat('simple')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        defaultLedgerDownloadFormat === 'simple'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('simple')}
                        </span>
                        {defaultLedgerDownloadFormat === 'simple' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {t('simpleFormatDesc')}
                      </p>
                    </button>

                    {/* Split Option */}
                    <button
                      onClick={() => setDefaultLedgerDownloadFormat('split')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${
                        defaultLedgerDownloadFormat === 'split'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('split')}
                        </span>
                        {defaultLedgerDownloadFormat === 'split' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {t('splitFormatDesc')}
                      </p>
                    </button>

                  </div>
                </div>
              </div>
            </div>

            {/* Language Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {t('languageSettings')}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('selectLanguage')}
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setLanguage('gu')}
                      className={`px-6 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                        language === 'gu'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      ગુજરાતી
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`px-6 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                        language === 'en'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Save Button Row */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow transition-all flex items-center gap-2"
            >
                  {t('saveConfiguration')}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Settings;
