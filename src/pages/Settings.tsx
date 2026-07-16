import React from 'react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { Settings as SettingsIcon, Globe, Layers, CheckCircle, Download, Type } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const {
    dateSortingMethod,
    setDateSortingMethod,
    defaultLedgerDownloadFormat,
    setDefaultLedgerDownloadFormat,
    fontSize,
    setFontSize,
    resetFontSize,
    showDriverDetails,
    setShowDriverDetails,
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

            {/* Font Size Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                    {t('fontSizeSettings') || 'Font Size'}
                  </h3>
                </div>
                <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {fontSize}px
                </span>
              </div>

              <div className="p-4 sm:p-6 space-y-5">

                {/* Quick preset buttons */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {t('quickSelect') || 'Quick Select'}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'A', size: 13, name: t('small') || 'Small' },
                      { label: 'A', size: 15, name: t('medium') || 'Normal' },
                      { label: 'A', size: 17, name: t('large') || 'Large' },
                      { label: 'A', size: 20, name: t('xlarge') || 'X-Large' },
                    ].map((preset) => (
                      <button
                        key={preset.size}
                        onClick={() => setFontSize(preset.size)}
                        className={`flex flex-col items-center py-3 px-2 rounded-xl border transition-all ${
                          fontSize === preset.size
                            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-500'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                        }`}
                      >
                        <span
                          style={{ fontSize: `${preset.size}px`, lineHeight: 1 }}
                          className="font-bold text-gray-800 mb-1"
                        >
                          {preset.label}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">{preset.name}</span>
                        {fontSize === preset.size && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600 mt-1" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {t('customSize') || 'Custom'}
                    </p>
                    <button
                      onClick={resetFontSize}
                      className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                    >
                      {t('reset') || 'Reset'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400" style={{ fontSize: '12px' }}>A</span>
                    <input
                      type="range"
                      min={12}
                      max={22}
                      step={1}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="flex-1 h-2 accent-blue-600 cursor-pointer"
                      style={{ accentColor: '#2563eb' }}
                    />
                    <span className="text-base font-bold text-gray-400" style={{ fontSize: '22px' }}>A</span>
                  </div>

                  <div className="flex justify-between mt-1 px-1">
                    {[12, 14, 16, 18, 20, 22].map(s => (
                      <span
                        key={s}
                        onClick={() => setFontSize(s)}
                        className={`text-[10px] cursor-pointer select-none transition-colors ${
                          fontSize === s ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Live preview */}
                <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                  <p className="text-[11px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">
                    {t('preview') || 'Preview'}
                  </p>
                  <p style={{ fontSize: `${fontSize}px` }} className="text-gray-800 font-semibold leading-snug">
                    {t('fontPreviewText') || 'ખાતા કેન્દ્ર — Khata Kendra'}
                  </p>
                  <p style={{ fontSize: `${fontSize * 0.85}px` }} className="text-gray-500 mt-1 leading-snug">
                    {t('fontPreviewSub') || 'Bills · Challans · Ledger · Stock'}
                  </p>
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

            {/* Extra Fields Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <SettingsIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {t('extraFieldsSettings') || 'Feature Visibility Settings'}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">
                      {t('enableDriverMobileVehicle') || 'Enable Driver Mobile Number & Vehicle'}
                    </label>
                    <p className="text-xs text-gray-500">
                      {t('enableDriverMobileVehicleDesc') || 'Show fields for Driver Mobile and Vehicle details during Jama and Udhar challan creation.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDriverDetails(!showDriverDetails)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showDriverDetails ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        showDriverDetails ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
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
