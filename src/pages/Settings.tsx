import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { Settings as SettingsIcon, Globe, Layers, CheckCircle, Download, Type, Lock, Unlock, Shield, Fingerprint, Key, Share2, CalendarClock, LayoutGrid, ChevronRight, Building2, Construction, TreePine } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../utils/supabase';
import { DEFAULT_BUSINESS_INFO, getBusinessInfo } from '../utils/businessInfo';
import { CATEGORY_LOCK_PASSWORD } from '../utils/categoryLock';
import type { LockableCategory } from '../contexts/SettingsContext';

const Settings: React.FC = () => {
  const navigate = useNavigate();
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
    showExtraCost,
    setShowExtraCost,
    shareBillMode,
    setShareBillMode,
    requireLoginPassword,
    setRequireLoginPassword,
    enableCategorySeparation,
    setEnableCategorySeparation,
    enableCategoryClientSeparation,
    setEnableCategoryClientSeparation,
    enableCategoryChallanSeparation,
    setEnableCategoryChallanSeparation,
    categoryLockEnabled,
    setCategoryLockEnabled,
    lockedCategory,
    setLockedCategory,
    jackMaterialType,
    setJackMaterialType,
    quickActionsSortMethod,
    setQuickActionsSortMethod,
    visibleQuickActions,
    setVisibleQuickActions,
    useCustomBusinessInfo,
    setUseCustomBusinessInfo,
    businessName,
    setBusinessName,
    businessPhone,
    setBusinessPhone,
    businessAddress,
    setBusinessAddress,
  } = useSettings();

  const resolvedBusinessInfo = getBusinessInfo(
    { useCustomBusinessInfo, businessName, businessPhone, businessAddress },
    language
  );

  const [securityEnabled, setSecurityEnabled] = React.useState(() => localStorage.getItem('security_lock_enabled') === 'true');
  const [pin, setPin] = React.useState(() => localStorage.getItem('security_lock_pin') || '1234');
  const [hasBiometrics, setHasBiometrics] = React.useState(false);
  const [isBiometricRegistered, setIsBiometricRegistered] = React.useState(() => !!localStorage.getItem('security_lock_cred_id'));

  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authPin, setAuthPin] = React.useState('');
  const [pendingToggle, setPendingToggle] = React.useState<boolean | null>(null);

  // Category Lock — restricts the app to a single business category
  // (Shuttering / Jack / Cuplock). Enabling, disabling, or changing which
  // category is locked all require the fixed owner password.
  type PendingCategoryLockAction =
    | { type: 'enable'; category: LockableCategory }
    | { type: 'disable' }
    | { type: 'change'; category: LockableCategory };
  const [showCategoryLockModal, setShowCategoryLockModal] = React.useState(false);
  const [categoryLockPasswordInput, setCategoryLockPasswordInput] = React.useState('');
  const [pendingCategoryLockAction, setPendingCategoryLockAction] = React.useState<PendingCategoryLockAction | null>(null);

  const lockableCategories: { id: LockableCategory; label: string }[] = [
    { id: 'shuttering', label: language === 'gu' ? 'શટરિંગ' : 'Shuttering' },
    { id: 'jack', label: language === 'gu' ? (jackMaterialType === 'wooden' ? 'ટેકા' : 'જેક') : (jackMaterialType === 'wooden' ? 'Teka' : 'Jack') },
    { id: 'cuplock', label: language === 'gu' ? 'કપલોક' : 'Cuplock' },
  ];

  const requestCategoryLockChange = (action: PendingCategoryLockAction) => {
    setPendingCategoryLockAction(action);
    setCategoryLockPasswordInput('');
    setShowCategoryLockModal(true);
  };

  const handleCategoryLockPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryLockPasswordInput !== CATEGORY_LOCK_PASSWORD) {
      toast.error(language === 'gu' ? 'ખોટો પાસવર્ડ!' : 'Incorrect password!');
      setCategoryLockPasswordInput('');
      return;
    }

    if (pendingCategoryLockAction) {
      if (pendingCategoryLockAction.type === 'disable') {
        setCategoryLockEnabled(false);
        toast.success(language === 'gu' ? 'વિભાગ લોક દૂર કરવામાં આવ્યું' : 'Category lock removed');
      } else {
        setLockedCategory(pendingCategoryLockAction.category);
        setCategoryLockEnabled(true);
        toast.success(language === 'gu' ? 'વિભાગ લોક લાગુ કરવામાં આવ્યું' : 'Category lock applied');
      }
    }

    setShowCategoryLockModal(false);
    setPendingCategoryLockAction(null);
    setCategoryLockPasswordInput('');
  };

  // Monthly bill cron on/off — stored in app_settings so the server-side
  // cron job can check it. null while loading from DB.
  const [cronEnabled, setCronEnabled] = React.useState<boolean | null>(null);

  const availableActions = [
    { id: '/udhar-challan', label: language === 'gu' ? 'ઉધાર ચલણ' : 'Udhar Challan' },
    { id: '/jama-challan', label: language === 'gu' ? 'જમા ચલણ' : 'Jama Challan' },
    { id: '/client-ledger', label: language === 'gu' ? 'ગ્રાહક ખાતાવહી' : 'Client Ledger' },
    { id: '/stock', label: language === 'gu' ? 'સ્ટોક મેનેજમેન્ટ' : 'Stock Management' },
    { id: '/clients', label: language === 'gu' ? 'ગ્રાહકો ઉમેરો' : 'Add Client' },
    { id: '/challan-book', label: language === 'gu' ? 'ચલણ બુક' : 'Challan Book' },
    { id: '/billing', label: language === 'gu' ? 'બિલ બનાવો' : 'Create Bill' },
    { id: '/bill-book', label: language === 'gu' ? 'બિલ બુક' : 'Bill Book' },
    { id: '/settings', label: language === 'gu' ? 'સેટિંગ્સ' : 'Settings' },
  ];

  const toggleQuickActionVisibility = (id: string) => {
    if (visibleQuickActions.includes(id)) {
      if (visibleQuickActions.length <= 1) {
        toast.error(language === 'gu' ? 'ઓછામાં ઓછી એક એક્શન સક્રિય હોવી જોઈએ!' : 'At least one quick action must remain active!');
        return;
      }
      setVisibleQuickActions(visibleQuickActions.filter(x => x !== id));
    } else {
      setVisibleQuickActions([...visibleQuickActions, id]);
    }
  };

  React.useEffect(() => {
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'monthly_bill_cron_enabled')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load cron setting:', error);
          return;
        }
        setCronEnabled(data ? data.value !== 'false' : true);
      });
  }, []);

  const handleToggleCron = async () => {
    if (cronEnabled === null) return; // still loading
    const next = !cronEnabled;
    setCronEnabled(next);
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'monthly_bill_cron_enabled', value: String(next), updated_at: new Date().toISOString() });
    if (error) {
      console.error('Failed to save cron setting:', error);
      setCronEnabled(!next); // revert on failure
      toast.error('Failed to save setting');
    } else {
      toast.success(next ? (t('cronEnabled') || 'Monthly billing on') : (t('cronDisabled') || 'Monthly billing off'));
    }
  };

  React.useEffect(() => {
    if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setHasBiometrics(available))
        .catch(err => console.error(err));
    }
  }, []);

  const handleAuthBiometric = async () => {
    try {
      if (!window.PublicKeyCredential) return;
      const savedCredIdHex = localStorage.getItem('security_lock_cred_id');
      if (!savedCredIdHex) return;

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const credIdBuffer = new Uint8Array(
        savedCredIdHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      );

      const options: CredentialRequestOptions = {
        publicKey: {
          challenge,
          timeout: 60000,
          allowCredentials: [{ type: 'public-key', id: credIdBuffer }],
          userVerification: 'required',
        },
      };

      const assertion = await navigator.credentials.get(options);
      if (assertion && pendingToggle !== null) {
        setSecurityEnabled(pendingToggle);
        localStorage.setItem('security_lock_enabled', String(pendingToggle));
        setShowAuthModal(false);
        setPendingToggle(null);
        toast.success(language === 'gu' ? "પ્રમાણીકરણ સફળ" : "Authentication Successful!");
      }
    } catch (err: any) {
      console.warn(err);
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        toast.error(language === 'gu' ? "વેરિફિકેશન નિષ્ફળ" : "Biometric Verification Failed");
      }
    }
  };

  const handleAuthPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('security_lock_pin');
    if (authPin === savedPin && pendingToggle !== null) {
      setSecurityEnabled(pendingToggle);
      localStorage.setItem('security_lock_enabled', String(pendingToggle));
      setShowAuthModal(false);
      setPendingToggle(null);
      setAuthPin('');
      toast.success(language === 'gu' ? "પ્રમાણીકરણ સફળ" : "Authentication Successful!");
    } else {
      toast.error(language === 'gu' ? "ખોટો પિન!" : "Incorrect PIN!");
      setAuthPin('');
    }
  };

  const handleToggleSecurity = () => {
    const hasExistingPin = localStorage.getItem('security_lock_pin');
    const targetState = !securityEnabled;
    
    if (hasExistingPin) {
      setPendingToggle(targetState);
      setShowAuthModal(true);
      setAuthPin('');
      // Auto-trigger biometric if registered
      if (isBiometricRegistered) {
        setTimeout(() => {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const savedCredIdHex = localStorage.getItem('security_lock_cred_id');
          if (savedCredIdHex) {
            const credIdBuffer = new Uint8Array(
              savedCredIdHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
            );
            navigator.credentials.get({
              publicKey: {
                challenge,
                timeout: 60000,
                allowCredentials: [{ type: 'public-key', id: credIdBuffer }],
                userVerification: 'required',
              }
            }).then(assertion => {
              if (assertion) {
                setSecurityEnabled(targetState);
                localStorage.setItem('security_lock_enabled', String(targetState));
                setShowAuthModal(false);
                setPendingToggle(null);
                toast.success(language === 'gu' ? "પ્રમાણીકરણ સફળ" : "Authentication Successful!");
              }
            }).catch(err => {
              console.warn(err);
            });
          }
        }, 300);
      }
    } else {
      setSecurityEnabled(targetState);
      localStorage.setItem('security_lock_enabled', String(targetState));
    }
  };

  const handleSave = () => {
    if (securityEnabled) {
      if (!/^\d{4}$/.test(pin)) {
        toast.error(language === 'gu' ? 'પિન બરાબર ૪ અંકોનો હોવો જોઈએ!' : 'PIN must be exactly 4 digits!');
        return;
      }
      localStorage.setItem('security_lock_pin', pin);
    }
    localStorage.setItem('security_lock_enabled', String(securityEnabled));
    toast.success(t('settingsSaved') || 'Settings saved successfully!');
  };

  const registerBiometrics = async () => {
    try {
      if (!window.PublicKeyCredential) {
        toast.error("Biometrics not supported on this device/browser");
        return;
      }

      // Use existing PIN if it is a valid 4-digit number, otherwise generate a random one
      const generatedPin = pin && pin.length === 4 ? pin : Math.floor(1000 + Math.random() * 9000).toString();

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const creationOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            name: "Khata Kendra PWA",
            id: window.location.hostname || "localhost"
          },
          user: {
            id: userId,
            name: "admin@khatakendra.com",
            displayName: "Administrator"
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" } // RS256
          ],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          }
        }
      };

      const credential = await navigator.credentials.create(creationOptions) as PublicKeyCredential;
      if (credential) {
        // Convert arrayBuffer to hex string to store in localStorage
        const rawId = new Uint8Array(credential.rawId);
        const hexId = Array.from(rawId).map(b => b.toString(16).padStart(2, '0')).join('');

        localStorage.setItem('security_lock_cred_id', hexId);
        localStorage.setItem('security_lock_pin', generatedPin);

        setPin(generatedPin);
        setIsBiometricRegistered(true);

        toast.success(
          language === 'gu'
            ? `બાયોમેટ્રિક સેટ થયું! તમારો બેકઅપ પિન: ${generatedPin}`
            : `Biometrics set! Your backup PIN: ${generatedPin}`,
          { duration: 6000 }
        );
      }
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        toast.error(language === 'gu' ? "નોંધણી નિષ્ફળ રહી" : "Registration failed");
      }
    }
  };

  const removeBiometrics = () => {
    localStorage.removeItem('security_lock_cred_id');
    setIsBiometricRegistered(false);
    toast.success(language === 'gu' ? "બાયોમેટ્રિક દૂર કરવામાં આવ્યું" : "Biometrics removed");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 w-full px-4 app-main-content pb-24 sm:px-6 lg:px-8 lg:py-8 lg:ml-64 transition-all duration-200">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header — hidden on mobile (navbar already shows page title) */}
          <div className="hidden lg:flex items-center gap-3 border-b border-gray-200 pb-4">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <SettingsIcon className="w-6 h-6 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-1">
            {/* Challan Export Design Card */}
            <button
              onClick={() => navigate('/settings/challan-designer')}
              className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-blue-300 transition-colors"
            >
              <div className="p-4 sm:p-6 flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                    {language === 'gu' ? 'ચલણ એક્સપોર્ટ ડિઝાઇન' : 'Challan Export Designs'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {language === 'gu'
                      ? 'એક્સપોર્ટ થયેલ ચલણ કેવું દેખાય તે ડિઝાઇન કરો: બેકગ્રાઉન્ડ ટેમ્પલેટ સેટ કરો અને ડેટા ફીલ્ડ્સ તેના પર ગોઠવો.'
                      : 'Design how exported challans look: set a background template and drag data fields onto it. Configure per item type.'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>

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
                      className={`relative p-4 rounded-xl border text-left transition-all ${dateSortingMethod === 'standard'
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
                      className={`relative p-4 rounded-xl border text-left transition-all ${dateSortingMethod === 'jamaFirst'
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
                      className={`relative p-4 rounded-xl border text-left transition-all ${defaultLedgerDownloadFormat === 'detailed'
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
                      className={`relative p-4 rounded-xl border text-left transition-all ${defaultLedgerDownloadFormat === 'simple'
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
                      className={`relative p-4 rounded-xl border text-left transition-all ${defaultLedgerDownloadFormat === 'split'
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
                      { label: 'A', size: 16, name: t('medium') || 'Normal' },
                      { label: 'A', size: 18, name: t('large') || 'Large' },
                      { label: 'A', size: 21, name: t('xlarge') || 'X-Large' },
                    ].map((preset) => (
                      <button
                        key={preset.size}
                        onClick={() => setFontSize(preset.size)}
                        className={`flex flex-col items-center py-3 px-2 rounded-xl border transition-all ${fontSize === preset.size
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
                        className={`text-[10px] cursor-pointer select-none transition-colors ${fontSize === s ? 'text-blue-600 font-bold' : 'text-gray-400 hover:text-gray-600'
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
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setLanguage('gu')}
                      className={`flex-1 px-6 py-2.5 rounded-lg text-sm font-semibold border transition-all ${language === 'gu'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      ગુજરાતી
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`flex-1 px-6 py-2.5 rounded-lg text-sm font-semibold border transition-all ${language === 'en'
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

            {/* Business Information Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {language === 'gu' ? 'વ્યવસાયની માહિતી' : 'Business Information'}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {language === 'gu' ? 'બિલ અને વોટ્સએપ સંદેશમાં કયું નામ બતાવવું?' : 'Which identity should appear on bills & WhatsApp messages?'}
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Default Option */}
                    <button
                      onClick={() => setUseCustomBusinessInfo(false)}
                      className={`relative p-4 rounded-xl border text-left transition-all ${!useCustomBusinessInfo
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {language === 'gu' ? 'મૂળભૂત (Khata Kendra)' : 'Default (Khata Kendra)'}
                        </span>
                        {!useCustomBusinessInfo && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {language === 'gu'
                          ? 'ખાતા કેન્દ્ર, બ્લુ સિટી, સીમાડા, સુરત — 88664 71567'
                          : 'Khata Kendra, Blue City, Simada, Surat — 88664 71567'}
                      </p>
                    </button>

                    {/* Custom Option */}
                    <button
                      onClick={() => setUseCustomBusinessInfo(true)}
                      className={`relative p-4 rounded-xl border text-left transition-all ${useCustomBusinessInfo
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {language === 'gu' ? 'મારો પોતાનો વ્યવસાય' : 'My Own Business'}
                        </span>
                        {useCustomBusinessInfo && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {language === 'gu'
                          ? 'નીચે તમારું નામ, ફોન નંબર અને સરનામું દાખલ કરો.'
                          : 'Enter your own name, phone number, and address below.'}
                      </p>
                    </button>
                  </div>
                </div>

                {useCustomBusinessInfo && (
                  <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-gray-100">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {language === 'gu' ? 'વ્યવસાયનું નામ' : 'Business Name'}
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder={DEFAULT_BUSINESS_INFO[language].name}
                        className="w-full py-2.5 px-3.5 text-gray-900 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {language === 'gu' ? 'ફોન નંબર' : 'Phone Number'}
                      </label>
                      <input
                        type="text"
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        placeholder={DEFAULT_BUSINESS_INFO[language].phone}
                        className="w-full py-2.5 px-3.5 text-gray-900 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {language === 'gu' ? 'સરનામું' : 'Address'}
                      </label>
                      <input
                        type="text"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        placeholder={DEFAULT_BUSINESS_INFO[language].address}
                        className="w-full py-2.5 px-3.5 text-gray-900 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Live preview */}
                <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                  <p className="text-[11px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">
                    {t('preview') || 'Preview'}
                  </p>
                  <p className="text-sm font-bold text-gray-800 leading-snug">{resolvedBusinessInfo.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{resolvedBusinessInfo.address}</p>
                  <p className="text-xs text-gray-500 leading-snug">{resolvedBusinessInfo.phone}</p>
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
                <button
                  onClick={() => setShowDriverDetails(!showDriverDetails)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${showDriverDetails
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="pr-4">
                    <span className="font-bold text-sm sm:text-base text-gray-900 block mb-1">
                      {t('enableDriverMobileVehicle') || 'Enable Driver Mobile Number & Vehicle'}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {t('enableDriverMobileVehicleDesc') || 'Show fields for Driver Mobile and Vehicle details during Jama and Udhar challan creation.'}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner ${showDriverDetails ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${showDriverDetails ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </button>

                <button
                  onClick={() => setShowExtraCost(!showExtraCost)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${showExtraCost
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="pr-4">
                    <span className="font-bold text-sm sm:text-base text-gray-900 block mb-1">
                      {language === 'gu'
                        ? 'ચલણમાં અતિરિક્ત ખર્ચ વિકલ્પો સક્રિય કરો (હમાલી, વાહન ભાડું, ડિપોઝિટ)'
                        : 'Enable Extra Cost Options (Loading/Unloading, Vehicle Rent, Deposit)'}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {language === 'gu'
                        ? 'ચલણ બનાવતી વખતે ભાડાની હમાલી, વાહન ભાડું અને ડિપોઝિટના વિકલ્પો બતાવો અને બિલની ગણતરીમાં તેને ઉમેરો.'
                        : 'Show fields for Loading & Unloading Charges, Vehicle Rent, and Deposit during Jama and Udhar challan creation, and include them in bill calculation.'}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner ${showExtraCost ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${showExtraCost ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </button>
              </div>
            </div>

            {/* Business Category & Client Separation Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {language === 'gu' ? 'વિભાગીય વ્યવસાય સેટિંગ્સ (Business Categories)' : 'Business Category & Client Separation'}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                
                {/* Category Separation */}
                <button
                  onClick={() => setEnableCategorySeparation(!enableCategorySeparation)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${enableCategorySeparation
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="pr-4">
                    <span className="font-bold text-sm sm:text-base text-gray-900 block mb-1">
                      {language === 'gu' ? 'વિભાગ આધારિત અલગ વ્યવસ્થા ચાલુ કરો (Shuttering, Jack, Cuplock, Other)' : 'Enable Business Category Separation'}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {language === 'gu'
                        ? 'શટરિંગ, જેક, કપલોક અને અન્ય માટે અલગ સ્ટોક, ચલણ અને બિલિંગ વ્યવસ્થા સક્રિય કરો.'
                        : 'Separate inventory, challans, and bills across Shuttering, Jack, Cuplock, and Other sections.'}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner ${enableCategorySeparation ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${enableCategorySeparation ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </button>

                {/* Separate Clients per Category */}
                <button
                  onClick={() => setEnableCategoryClientSeparation(!enableCategoryClientSeparation)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${enableCategoryClientSeparation
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="pr-4">
                    <span className="font-bold text-sm sm:text-base text-gray-900 block mb-1">
                      {language === 'gu' ? 'દરેક વિભાગ માટે અલગ ગ્રાહક લિસ્ટ (Separate Client Lists per Category)' : 'Separate Clients for Separate Business Categories'}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {language === 'gu'
                        ? 'જ્યારે વિભાગ બદલો (શટરિંગ / જેક / કપલોક), ત્યારે તે વિભાગના ગ્રાહકો જ લિસ્ટ અને ચલણમાં બતાવો.'
                        : 'Filter and display separate client lists when switching between business categories (Shuttering, Jack, Cuplock, Other).'}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner ${enableCategoryClientSeparation ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${enableCategoryClientSeparation ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </button>

                {/* Separate Challan / Jalan Numbers per Category */}
                <button
                  onClick={() => setEnableCategoryChallanSeparation(!enableCategoryChallanSeparation)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${enableCategoryChallanSeparation
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="pr-4">
                    <span className="font-bold text-sm sm:text-base text-gray-900 block mb-1">
                      {language === 'gu' ? 'દરેક વિભાગ માટે અલગ ચલણ (Jalan) નંબર સિક્વન્સ (Separate Jalan/Challan Numbers per Category)' : 'Separate Jalan/Challan Numbers for Business Categories'}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {language === 'gu'
                        ? 'જ્યારે વિભાગ બદલો (શટરિંગ / જેક / કપલોક), ત્યારે તે વિભાગ માટે ૧ થી શરૂ કરીને અલગ ચલણ (Jalan) નંબર સિક્વન્સ જનરેટ કરો.'
                        : 'Generate separate auto-incrementing challan/jalan number sequences for each business category (Shuttering, Jack, Cuplock, Other).'}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner ${enableCategoryChallanSeparation ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${enableCategoryChallanSeparation ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </button>



              </div>
            </div>

            {/* Category Lock Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                {categoryLockEnabled ? <Lock className="w-5 h-5 text-blue-600" /> : <Unlock className="w-5 h-5 text-blue-600" />}
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {language === 'gu' ? 'વિભાગ લોક (પાસવર્ડ સુરક્ષિત)' : 'Category Lock (Password Protected)'}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  {language === 'gu'
                    ? 'એપ્લિકેશનને ફક્ત શટરિંગ, જેક અથવા કપલોકમાંથી એક જ વિભાગ માટે લોક કરો. વિભાગ સ્વિચર છુપાવવામાં આવશે અને લોક ચાલુ/બંધ કરવા અથવા બદલવા માટે પાસવર્ડ જરૂરી રહેશે.'
                    : 'Lock the whole app to just one of Shuttering, Jack, or Cuplock. The category switcher is hidden while locked, and enabling, disabling, or changing the lock always requires the password.'}
                </p>

                {categoryLockEnabled && lockedCategory ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-blue-600 bg-blue-50/40 ring-1 ring-blue-500">
                    <div className="flex-1">
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide block mb-1">
                        {language === 'gu' ? 'હાલમાં લોક' : 'Currently Locked To'}
                      </span>
                      <span className="font-bold text-sm sm:text-base text-gray-900">
                        {lockableCategories.find(c => c.id === lockedCategory)?.label}
                      </span>
                    </div>
                    <button
                      onClick={() => requestCategoryLockChange({ type: 'disable' })}
                      className="px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      {language === 'gu' ? 'લોક દૂર કરો' : 'Remove Lock'}
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {lockableCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => requestCategoryLockChange({ type: 'enable', category: cat.id })}
                        className="relative p-4 rounded-xl border text-left transition-all border-gray-200 hover:border-blue-400 bg-white"
                      >
                        <span className="font-bold text-sm text-gray-900 block mb-1">{cat.label}</span>
                        <span className="text-[11px] text-gray-500">
                          {language === 'gu' ? 'આ વિભાગ પર લોક કરો' : 'Lock to this category'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Jack Material Type Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Construction className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {language === 'gu' ? 'જેક સામગ્રી પ્રકાર' : 'Jack Material Type'}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  {language === 'gu'
                    ? 'લોખંડના જેક ઈનર અને આઉટર એમ બે ભાગમાં અલગ-અલગ ટ્રેક થાય છે. લાકડાના જેકને ફક્ત "ટેકા" તરીકે ઓળખવામાં આવે છે અને એક જ સામાન્ય આઈટમ તરીકે ટ્રેક થાય છે.'
                    : 'Iron jacks are tracked as two separate portions — Inner and Outer. Wooden jacks are just renamed "Teka" and tracked as a single, simple item — nothing else changes.'}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setJackMaterialType('iron')}
                    className={`relative p-4 rounded-xl border text-left transition-all ${jackMaterialType === 'iron'
                        ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                        <Construction className="w-4 h-4 text-gray-500" />
                        {language === 'gu' ? 'લોખંડ (Iron)' : 'Iron'}
                      </span>
                      {jackMaterialType === 'iron' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {language === 'gu' ? 'ઈનર અને આઉટર અલગ-અલગ ટ્રેક કરો' : 'Track Inner and Outer separately'}
                    </p>
                  </button>

                  <button
                    onClick={() => setJackMaterialType('wooden')}
                    className={`relative p-4 rounded-xl border text-left transition-all ${jackMaterialType === 'wooden'
                        ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                        <TreePine className="w-4 h-4 text-gray-500" />
                        {language === 'gu' ? 'લાકડું (Wooden) — ટેકા' : 'Wooden — Teka'}
                      </span>
                      {jackMaterialType === 'wooden' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {language === 'gu' ? 'ફક્ત નામ બદલાય છે, એક જ સામાન્ય આઈટમ' : 'Just a name change, tracked as one simple item'}
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Monthly Bill Cron Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <CalendarClock className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {t('monthlyBillCronSettings') || 'Automatic Monthly Billing'}
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <button
                  onClick={handleToggleCron}
                  disabled={cronEnabled === null}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all disabled:opacity-60 ${cronEnabled
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="pr-4">
                    <span className="font-bold text-sm sm:text-base text-gray-900 block mb-1">
                      {t('enableMonthlyBillCron') || 'Auto-create bills on the 1st'}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {t('enableMonthlyBillCronDesc') || 'On the 1st of every month, draft bills are created automatically for all clients with pending billing. Turn off to stop scheduled billing; the Create All Bills button keeps working either way.'}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner ${cronEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${cronEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </button>
              </div>
            </div>

            {/* Bill Sharing Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Share2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {t('billSharingSettings')}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('shareBillMode')}
                  </label>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    {t('shareBillModeDesc')}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Share as Image */}
                    <button
                      onClick={() => setShareBillMode('image')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${shareBillMode === 'image'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('shareAsImage')}
                        </span>
                        {shareBillMode === 'image' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>

                    {/* Share as Text */}
                    <button
                      onClick={() => setShareBillMode('text')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${shareBillMode === 'text'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {t('shareAsText')}
                        </span>
                        {shareBillMode === 'text' && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PWA Security Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {language === 'gu' ? 'એપ્લિકેશન સુરક્ષા સેટિંગ્સ' : 'App Security & Lock Settings'}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-6">

                {/* Enable Lock Switch */}
                <button
                  onClick={handleToggleSecurity}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${securityEnabled
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="pr-4">
                    <span className="font-bold text-sm sm:text-base text-gray-900 block mb-1">
                      {language === 'gu' ? 'એપ લોક ચાલુ કરો' : 'Enable Application Lock'}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {language === 'gu' ? 'મોબાઇલ PWA શરૂ થવા પર પિન અથવા ફિંગરપ્રિન્ટ પૂછશે.' : 'Require PIN or Biometrics authentication on app startup.'}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner ${securityEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${securityEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </button>

                {/* Require Login Password Switch */}
                <button
                  onClick={() => setRequireLoginPassword(!requireLoginPassword)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${requireLoginPassword
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="pr-4">
                    <span className="font-bold text-sm sm:text-base text-gray-900 block mb-1">
                      {language === 'gu' ? 'લોગિન પાસવર્ડ જરૂરી કરો' : 'Require Login Password'}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {language === 'gu' ? 'એપ્લિકેશન ખોલતી વખતે મુખ્ય એકાઉન્ટ પાસવર્ડ પૂછશે.' : 'Require account login password every time app is opened.'}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner ${requireLoginPassword ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${requireLoginPassword ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </button>

                {/* Separate Categories Switch */}
                <button
                  onClick={() => setEnableCategorySeparation(!enableCategorySeparation)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${enableCategorySeparation
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div className="pr-4">
                    <span className="font-bold text-sm sm:text-base text-gray-900 block mb-1">
                      {language === 'gu' ? 'વ્યવસાય શ્રેણીઓ અલગ કરો' : 'Separate Business Categories'}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {language === 'gu' ? 'શટરિંગ, જેક, કપલોક અને અન્ય માટે ક્લાયન્ટ અને વ્યવહારો સંપૂર્ણપણે અલગ કરો.' : 'Separate clients, challans, and bills for Shuttering, Jack, Cuplock, and Other.'}
                    </p>
                  </div>
                  <div className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out shadow-inner ${enableCategorySeparation ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${enableCategorySeparation ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </button>

                {securityEnabled && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">

                    {/* PIN Input */}
                    <div className="max-w-xs">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center justify-between">
                        <span>{language === 'gu' ? '૪-અંકનો સુરક્ષા પિન' : '4-Digit Security PIN'}</span>
                        {isBiometricRegistered && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                            {language === 'gu' ? 'બાયોમેટ્રિક બેકઅપ પિન' : 'Biometric Backup PIN'}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <Key className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                        <input
                          type="password"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          maxLength={4}
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          className="w-full py-2.5 pl-10 pr-4 text-gray-900 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-mono text-lg tracking-widest text-center"
                          placeholder="••••"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {language === 'gu'
                          ? 'બાયોમેટ્રિક કામ ન કરે અથવા ઉપલબ્ધ ન હોય ત્યારે અનલોક કરવા માટે કસ્ટમ પિન સેટ કરો.'
                          : 'Set a custom backup PIN to use if biometrics is unavailable or fails.'}
                      </p>
                    </div>

                    {/* Biometrics Setup */}
                    {hasBiometrics && (
                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {language === 'gu' ? 'બાયોમેટ્રિક લોક (ફિંગરપ્રિન્ટ / ફેસ આઈડી)' : 'Biometric Lock (Fingerprint / FaceID)'}
                        </label>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {isBiometricRegistered ? (
                            <>
                              <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                                <Fingerprint className="w-5 h-5" />
                                <span>{language === 'gu' ? 'બાયોમેટ્રિક લોક સક્રિય છે' : 'Biometrics registered'}</span>
                              </div>
                              <button
                                onClick={removeBiometrics}
                                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-center"
                              >
                                {language === 'gu' ? 'દૂર કરો' : 'Remove'}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={registerBiometrics}
                              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Fingerprint className="w-4 h-4" />
                              {language === 'gu' ? 'બાયોમેટ્રિક સેટઅપ કરો' : 'Register Biometric Credential'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Dashboard Quick Actions Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {language === 'gu' ? 'ડેશબોર્ડ સેટિંગ્સ' : 'Dashboard Settings'}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {language === 'gu' ? 'ક્વિક એક્શન સૉર્ટ કરવાની પદ્ધતિ' : 'Quick Actions Sorting Method'}
                  </label>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    {language === 'gu' 
                      ? 'પસંદ કરો કે ડેશબોર્ડ પર ક્વિક એક્શન બટનો કઈ રીતે ગોઠવવા.' 
                      : 'Choose how to sort the quick action buttons on the main dashboard.'}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Default */}
                    <button
                      onClick={() => setQuickActionsSortMethod('default')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${quickActionsSortMethod === 'default'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {language === 'gu' ? 'મૂળભૂત' : 'Default'}
                        </span>
                        {quickActionsSortMethod === 'default' && (
                          <CheckCircle className="w-5 h-5 text-blue-600 shadow-sm" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-normal">
                        {language === 'gu' ? 'મૂળભૂત ક્રમમાં બતાવો' : 'Standard pre-defined order'}
                      </p>
                    </button>

                    {/* Alphabetical */}
                    <button
                      onClick={() => setQuickActionsSortMethod('alphabetical')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${quickActionsSortMethod === 'alphabetical'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {language === 'gu' ? 'અકારાદિ ક્રમ' : 'Alphabetical'}
                        </span>
                        {quickActionsSortMethod === 'alphabetical' && (
                          <CheckCircle className="w-5 h-5 text-blue-600 shadow-sm" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-normal">
                        {language === 'gu' ? 'નામ પ્રમાણે સૉર્ટ કરો (A-Z)' : 'Sort by action title (A-Z)'}
                      </p>
                    </button>

                    {/* Most Used */}
                    <button
                      onClick={() => setQuickActionsSortMethod('mostUsed')}
                      className={`relative p-4 rounded-xl border text-left transition-all ${quickActionsSortMethod === 'mostUsed'
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm sm:text-base text-gray-900">
                          {language === 'gu' ? 'વધુ વપરાતા' : 'Most Used'}
                        </span>
                        {quickActionsSortMethod === 'mostUsed' && (
                          <CheckCircle className="w-5 h-5 text-blue-600 shadow-sm" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-normal">
                        {language === 'gu' ? 'વધુ ક્લિક કરેલ પ્રથમ બતાવો' : 'Most frequently clicked first'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Visible Actions Selector */}
                <div className="pt-6 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {language === 'gu' ? 'દર્શાવવા માટે ક્વિક એક્શન પસંદ કરો' : 'Select Visible Quick Actions'}
                  </label>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    {language === 'gu' 
                      ? 'ડેશબોર્ડ પર કયા ક્વિક એક્શન બટનો બતાવવા તે પસંદ કરો.' 
                      : 'Choose which quick action buttons you want to see on the dashboard.'}
                  </p>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
                    {availableActions.map((act) => {
                      const isVisible = visibleQuickActions.includes(act.id);
                      return (
                        <button
                          key={act.id}
                          onClick={() => toggleQuickActionVisibility(act.id)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                            isVisible
                              ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500 font-bold text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">{act.label}</span>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isVisible
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isVisible && (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Save Button Row */}
          <div className="flex justify-end pt-4 pb-24 sm:pb-6">
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              {t('saveConfiguration')}
            </button>
          </div>

          {/* Auth Verification Modal */}
          {showAuthModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black bg-opacity-60 sm:p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-scale-in border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 p-3 bg-blue-50 text-blue-600 rounded-full animate-bounce">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {language === 'gu' ? 'સુરક્ષા ચકાસણી' : 'Security Verification'}
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">
                    {language === 'gu' 
                      ? 'સેટિંગ બદલવા માટે તમારો પિન અથવા બાયોમેટ્રિક દાખલ કરો.' 
                      : 'Enter your PIN or use biometrics to verify it\'s you.'}
                  </p>

                  <form onSubmit={handleAuthPinSubmit} className="w-full space-y-4">
                    <div className="relative max-w-[200px] mx-auto">
                      <Key className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        type="password"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={4}
                        value={authPin}
                        onChange={(e) => setAuthPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full py-2.5 pl-10 pr-4 text-gray-900 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-mono text-lg tracking-widest text-center"
                        placeholder="••••"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAuthModal(false);
                          setPendingToggle(null);
                        }}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {language === 'gu' ? 'રદ કરો' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={authPin.length !== 4}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        {language === 'gu' ? 'ચકાસો' : 'Verify'}
                      </button>
                    </div>

                    {isBiometricRegistered && (
                      <button
                        type="button"
                        onClick={handleAuthBiometric}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 rounded-xl transition-colors mt-2"
                      >
                        <Fingerprint className="w-4 h-4" />
                        {language === 'gu' ? 'બાયોમેટ્રિક સ્કેન કરો' : 'Scan Biometrics'}
                      </button>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Category Lock Password Modal */}
          {showCategoryLockModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black bg-opacity-60 sm:p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-scale-in border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 p-3 bg-blue-50 text-blue-600 rounded-full">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {language === 'gu' ? 'પાસવર્ડ જરૂરી' : 'Password Required'}
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">
                    {language === 'gu'
                      ? 'વિભાગ લોક બદલવા માટે પાસવર્ડ દાખલ કરો.'
                      : 'Enter the password to change the category lock.'}
                  </p>

                  <form onSubmit={handleCategoryLockPasswordSubmit} className="w-full space-y-4">
                    <div className="relative">
                      <Key className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        type="password"
                        value={categoryLockPasswordInput}
                        onChange={(e) => setCategoryLockPasswordInput(e.target.value)}
                        className="w-full py-2.5 pl-10 pr-4 text-gray-900 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        placeholder={language === 'gu' ? 'પાસવર્ડ' : 'Password'}
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryLockModal(false);
                          setPendingCategoryLockAction(null);
                          setCategoryLockPasswordInput('');
                        }}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {language === 'gu' ? 'રદ કરો' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={!categoryLockPasswordInput}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        {language === 'gu' ? 'ચકાસો' : 'Verify'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Settings;
