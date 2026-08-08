import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';

export type DateSortingMethod = 'standard' | 'jamaFirst';
export type LedgerDownloadFormat = 'detailed' | 'simple' | 'split';
export type ShareBillMode = 'image' | 'text';
export type BusinessCategory = 'shuttering' | 'jack' | 'cuplock' | 'other';
export type QuickActionsSortMethod = 'default' | 'alphabetical' | 'mostUsed';

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 22;
const DEFAULT_FONT_SIZE = 16;

interface SettingsContextType {
  dateSortingMethod: DateSortingMethod;
  setDateSortingMethod: (method: DateSortingMethod) => void;
  defaultLedgerDownloadFormat: LedgerDownloadFormat;
  setDefaultLedgerDownloadFormat: (format: LedgerDownloadFormat) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  showDriverDetails: boolean;
  setShowDriverDetails: (show: boolean) => void;
  showExtraCost: boolean;
  setShowExtraCost: (show: boolean) => void;
  shareBillMode: ShareBillMode;
  setShareBillMode: (mode: ShareBillMode) => void;
  requireLoginPassword: boolean;
  setRequireLoginPassword: (val: boolean) => void;
  enableCategorySeparation: boolean;
  setEnableCategorySeparation: (val: boolean) => void;
  enableCategoryClientSeparation: boolean;
  setEnableCategoryClientSeparation: (val: boolean) => void;
  enableCategoryChallanSeparation: boolean;
  setEnableCategoryChallanSeparation: (val: boolean) => void;
  activeCategory: BusinessCategory | null;
  setActiveCategory: (category: BusinessCategory | null) => void;
  quickActionsSortMethod: QuickActionsSortMethod;
  setQuickActionsSortMethod: (method: QuickActionsSortMethod) => void;
  visibleQuickActions: string[];
  setVisibleQuickActions: (actions: string[]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dateSortingMethod, setDateSortingMethodState] = useState<DateSortingMethod>(() => {
    const saved = localStorage.getItem('dateSortingMethod');
    return (saved === 'jamaFirst' || saved === 'standard') ? saved : 'standard';
  });

  const [defaultLedgerDownloadFormat, setDefaultLedgerDownloadFormatState] = useState<LedgerDownloadFormat>(() => {
    const saved = localStorage.getItem('defaultLedgerDownloadFormat');
    return (saved === 'detailed' || saved === 'simple' || saved === 'split') ? saved : 'detailed';
  });

  const [fontSize, setFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem('appFontSize');
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE;
    return isNaN(parsed) ? DEFAULT_FONT_SIZE : Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, parsed));
  });

  const [showDriverDetails, setShowDriverDetailsState] = useState<boolean>(() => {
    const saved = localStorage.getItem('showDriverDetails');
    return saved === 'true'; // Default is false unless explicitly enabled
  });

  const [showExtraCost, setShowExtraCostState] = useState<boolean>(() => {
    const saved = localStorage.getItem('showExtraCost');
    return saved !== 'false'; // Default is true unless explicitly disabled
  });

  const [shareBillMode, setShareBillModeState] = useState<ShareBillMode>(() => {
    const saved = localStorage.getItem('shareBillMode');
    return (saved === 'text' || saved === 'image') ? saved : 'image';
  });

  const [requireLoginPassword, setRequireLoginPasswordState] = useState<boolean>(() => {
    const saved = localStorage.getItem('requireLoginPassword');
    return saved === 'true';
  });

  const [enableCategorySeparation, setEnableCategorySeparationState] = useState<boolean>(() => {
    const saved = localStorage.getItem('enableCategorySeparation');
    return saved === 'true';
  });

  const [activeCategory, setActiveCategoryState] = useState<BusinessCategory | null>(() => {
    const saved = sessionStorage.getItem('activeCategory');
    return (saved === 'shuttering' || saved === 'jack' || saved === 'cuplock' || saved === 'other') ? saved : null;
  });

  const [quickActionsSortMethod, setQuickActionsSortMethodState] = useState<QuickActionsSortMethod>(() => {
    const saved = localStorage.getItem('quickActionsSortMethod');
    return (saved === 'default' || saved === 'alphabetical' || saved === 'mostUsed') ? saved : 'default';
  });

  const [visibleQuickActions, setVisibleQuickActionsState] = useState<string[]>(() => {
    const saved = localStorage.getItem('visibleQuickActions');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse visibleQuickActions:', e);
    }
    return ['/udhar-challan', '/jama-challan', '/client-ledger', '/stock', '/clients', '/challan-book', '/billing', '/bill-book', '/settings'];
  });

  // Helper to push setting updates to Supabase app_settings
  const syncAppSetting = (key: string, value: string) => {
    supabase
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.error(`Failed to sync ${key} to app_settings:`, error);
      });
  };

  useEffect(() => {
    const applySettingKV = (key: string, value: string) => {
      if (value === undefined || value === null) return;
      switch (key) {
        case 'date_sorting_method':
          if (value === 'jamaFirst' || value === 'standard') {
            setDateSortingMethodState(value);
            localStorage.setItem('dateSortingMethod', value);
          }
          break;
        case 'default_ledger_download_format':
          if (value === 'detailed' || value === 'simple' || value === 'split') {
            setDefaultLedgerDownloadFormatState(value);
            localStorage.setItem('defaultLedgerDownloadFormat', value);
          }
          break;
        case 'app_font_size': {
          const parsed = parseInt(value, 10);
          if (!isNaN(parsed)) {
            const clamped = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, parsed));
            setFontSizeState(clamped);
            localStorage.setItem('appFontSize', String(clamped));
          }
          break;
        }
        case 'show_driver_details': {
          const val = value === 'true';
          setShowDriverDetailsState(val);
          localStorage.setItem('showDriverDetails', String(val));
          break;
        }
        case 'show_extra_cost': {
          const val = value !== 'false';
          setShowExtraCostState(val);
          localStorage.setItem('showExtraCost', String(val));
          break;
        }
        case 'share_bill_mode':
          if (value === 'text' || value === 'image') {
            setShareBillModeState(value);
            localStorage.setItem('shareBillMode', value);
          }
          break;
        case 'enable_category_separation': {
          const val = value === 'true';
          setEnableCategorySeparationState(val);
          localStorage.setItem('enableCategorySeparation', String(val));
          break;
        }
        case 'enable_category_client_separation': {
          const val = value === 'true';
          setEnableCategoryClientSeparationState(val);
          localStorage.setItem('enableCategoryClientSeparation', String(val));
          break;
        }
        case 'enable_category_challan_separation': {
          const val = value === 'true';
          setEnableCategoryChallanSeparationState(val);
          localStorage.setItem('enableCategoryChallanSeparation', String(val));
          break;
        }
        case 'quick_actions_sort_method':
          if (value === 'default' || value === 'alphabetical' || value === 'mostUsed') {
            setQuickActionsSortMethodState(value);
            localStorage.setItem('quickActionsSortMethod', value);
          }
          break;
        case 'visible_quick_actions':
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              setVisibleQuickActionsState(parsed);
              localStorage.setItem('visibleQuickActions', JSON.stringify(parsed));
            }
          } catch (e) {
            // ignore JSON error
          }
          break;
      }
    };

    const fetchRemoteSettings = async () => {
      try {
        const { data, error } = await supabase.from('app_settings').select('key, value');
        if (error || !data) return;
        data.forEach(({ key, value }) => applySettingKV(key, value));
      } catch (e) {
        console.warn('Failed to fetch app settings:', e);
      }
    };

    fetchRemoteSettings();

    const channel = supabase
      .channel('app_settings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
        const { key, value } = (payload.new || {}) as { key?: string; value?: string };
        if (key && value !== undefined) {
          applySettingKV(key, value);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('dateSortingMethod', dateSortingMethod);
  }, [dateSortingMethod]);

  useEffect(() => {
    localStorage.setItem('defaultLedgerDownloadFormat', defaultLedgerDownloadFormat);
  }, [defaultLedgerDownloadFormat]);

  // Apply font size to the root html element so rem-based sizes scale globally
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem('appFontSize', String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('showDriverDetails', String(showDriverDetails));
  }, [showDriverDetails]);

  useEffect(() => {
    localStorage.setItem('showExtraCost', String(showExtraCost));
  }, [showExtraCost]);

  useEffect(() => {
    localStorage.setItem('shareBillMode', shareBillMode);
  }, [shareBillMode]);

  useEffect(() => {
    localStorage.setItem('requireLoginPassword', String(requireLoginPassword));
  }, [requireLoginPassword]);

  useEffect(() => {
    localStorage.setItem('enableCategorySeparation', String(enableCategorySeparation));
    if (!enableCategorySeparation) {
      setActiveCategoryState(null);
      sessionStorage.removeItem('activeCategory');
    }
  }, [enableCategorySeparation]);

  useEffect(() => {
    if (activeCategory) {
      sessionStorage.setItem('activeCategory', activeCategory);
    } else {
      sessionStorage.removeItem('activeCategory');
    }
  }, [activeCategory]);

  useEffect(() => {
    localStorage.setItem('quickActionsSortMethod', quickActionsSortMethod);
  }, [quickActionsSortMethod]);

  useEffect(() => {
    localStorage.setItem('visibleQuickActions', JSON.stringify(visibleQuickActions));
  }, [visibleQuickActions]);

  const setDateSortingMethod = (method: DateSortingMethod) => {
    setDateSortingMethodState(method);
    localStorage.setItem('dateSortingMethod', method);
    syncAppSetting('date_sorting_method', method);
  };

  const setDefaultLedgerDownloadFormat = (format: LedgerDownloadFormat) => {
    setDefaultLedgerDownloadFormatState(format);
    localStorage.setItem('defaultLedgerDownloadFormat', format);
    syncAppSetting('default_ledger_download_format', format);
  };

  const setFontSize = (size: number) => {
    const clamped = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, size));
    setFontSizeState(clamped);
    localStorage.setItem('appFontSize', String(clamped));
    syncAppSetting('app_font_size', String(clamped));
  };

  const increaseFontSize = () => {
    const next = Math.min(MAX_FONT_SIZE, fontSize + 1);
    setFontSizeState(next);
    localStorage.setItem('appFontSize', String(next));
    syncAppSetting('app_font_size', String(next));
  };

  const decreaseFontSize = () => {
    const next = Math.max(MIN_FONT_SIZE, fontSize - 1);
    setFontSizeState(next);
    localStorage.setItem('appFontSize', String(next));
    syncAppSetting('app_font_size', String(next));
  };

  const resetFontSize = () => {
    setFontSizeState(DEFAULT_FONT_SIZE);
    localStorage.setItem('appFontSize', String(DEFAULT_FONT_SIZE));
    syncAppSetting('app_font_size', String(DEFAULT_FONT_SIZE));
  };

  const setShowDriverDetails = (show: boolean) => {
    setShowDriverDetailsState(show);
    localStorage.setItem('showDriverDetails', String(show));
    syncAppSetting('show_driver_details', String(show));
  };

  const setShowExtraCost = (show: boolean) => {
    setShowExtraCostState(show);
    localStorage.setItem('showExtraCost', String(show));
    syncAppSetting('show_extra_cost', String(show));
  };

  const setShareBillMode = (mode: ShareBillMode) => {
    setShareBillModeState(mode);
    localStorage.setItem('shareBillMode', mode);
    syncAppSetting('share_bill_mode', mode);
  };

  const setRequireLoginPassword = (val: boolean) => {
    setRequireLoginPasswordState(val);
    localStorage.setItem('requireLoginPassword', String(val));
    // Require Login Password is part of App Security & Lock Settings, so it is kept strictly local
  };

  const setEnableCategorySeparation = (val: boolean) => {
    setEnableCategorySeparationState(val);
    localStorage.setItem('enableCategorySeparation', String(val));
    syncAppSetting('enable_category_separation', String(val));
  };

  const [enableCategoryClientSeparation, setEnableCategoryClientSeparationState] = useState<boolean>(() => {
    const saved = localStorage.getItem('enableCategoryClientSeparation');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('enableCategoryClientSeparation', String(enableCategoryClientSeparation));
  }, [enableCategoryClientSeparation]);

  const setEnableCategoryClientSeparation = (val: boolean) => {
    setEnableCategoryClientSeparationState(val);
    localStorage.setItem('enableCategoryClientSeparation', String(val));
    syncAppSetting('enable_category_client_separation', String(val));
  };

  const [enableCategoryChallanSeparation, setEnableCategoryChallanSeparationState] = useState<boolean>(() => {
    const saved = localStorage.getItem('enableCategoryChallanSeparation');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('enableCategoryChallanSeparation', String(enableCategoryChallanSeparation));
  }, [enableCategoryChallanSeparation]);

  const setEnableCategoryChallanSeparation = (val: boolean) => {
    setEnableCategoryChallanSeparationState(val);
    localStorage.setItem('enableCategoryChallanSeparation', String(val));
    syncAppSetting('enable_category_challan_separation', String(val));
  };

  const setActiveCategory = (category: BusinessCategory | null) => {
    setActiveCategoryState(category);
  };

  const setQuickActionsSortMethod = (method: QuickActionsSortMethod) => {
    setQuickActionsSortMethodState(method);
    localStorage.setItem('quickActionsSortMethod', method);
    syncAppSetting('quick_actions_sort_method', method);
  };

  const setVisibleQuickActions = (actions: string[]) => {
    setVisibleQuickActionsState(actions);
    localStorage.setItem('visibleQuickActions', JSON.stringify(actions));
    syncAppSetting('visible_quick_actions', JSON.stringify(actions));
  };

  return (
    <SettingsContext.Provider value={{
      dateSortingMethod,
      setDateSortingMethod,
      defaultLedgerDownloadFormat,
      setDefaultLedgerDownloadFormat,
      fontSize,
      setFontSize,
      increaseFontSize,
      decreaseFontSize,
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
      activeCategory,
      setActiveCategory,
      quickActionsSortMethod,
      setQuickActionsSortMethod,
      visibleQuickActions,
      setVisibleQuickActions,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
