import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';

export type DateSortingMethod = 'standard' | 'jamaFirst';
export type LedgerDownloadFormat = 'detailed' | 'simple' | 'split';
export type ShareBillMode = 'image' | 'text';
export type BusinessCategory = 'shuttering' | 'jack' | 'cuplock' | 'other';

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
  shareBillMode: ShareBillMode;
  setShareBillMode: (mode: ShareBillMode) => void;
  requireLoginPassword: boolean;
  setRequireLoginPassword: (val: boolean) => void;
  enableCategorySeparation: boolean;
  setEnableCategorySeparation: (val: boolean) => void;
  activeCategory: BusinessCategory | null;
  setActiveCategory: (category: BusinessCategory | null) => void;
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

  const setDateSortingMethod = (method: DateSortingMethod) => {
    setDateSortingMethodState(method);
    // Sync to DB so server-side jobs (monthly bill cron) use the same
    // bill-calculation setting as the app. Fire-and-forget.
    supabase
      .from('app_settings')
      .upsert({ key: 'date_sorting_method', value: method, updated_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.error('Failed to sync date_sorting_method to app_settings:', error);
      });
  };

  const setDefaultLedgerDownloadFormat = (format: LedgerDownloadFormat) => {
    setDefaultLedgerDownloadFormatState(format);
  };

  const setFontSize = (size: number) => {
    setFontSizeState(Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, size)));
  };

  const increaseFontSize = () => {
    setFontSizeState(prev => Math.min(MAX_FONT_SIZE, prev + 1));
  };

  const decreaseFontSize = () => {
    setFontSizeState(prev => Math.max(MIN_FONT_SIZE, prev - 1));
  };

  const resetFontSize = () => {
    setFontSizeState(DEFAULT_FONT_SIZE);
  };

  const setShowDriverDetails = (show: boolean) => {
    setShowDriverDetailsState(show);
  };

  const setShareBillMode = (mode: ShareBillMode) => {
    setShareBillModeState(mode);
  };

  const setRequireLoginPassword = (val: boolean) => {
    setRequireLoginPasswordState(val);
  };

  const setEnableCategorySeparation = (val: boolean) => {
    setEnableCategorySeparationState(val);
  };

  const setActiveCategory = (category: BusinessCategory | null) => {
    setActiveCategoryState(category);
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
      shareBillMode,
      setShareBillMode,
      requireLoginPassword,
      setRequireLoginPassword,
      enableCategorySeparation,
      setEnableCategorySeparation,
      activeCategory,
      setActiveCategory,
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
