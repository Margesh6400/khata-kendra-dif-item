import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DateSortingMethod = 'standard' | 'jamaFirst';
export type LedgerDownloadFormat = 'detailed' | 'simple' | 'split';

interface SettingsContextType {
  dateSortingMethod: DateSortingMethod;
  setDateSortingMethod: (method: DateSortingMethod) => void;
  defaultLedgerDownloadFormat: LedgerDownloadFormat;
  setDefaultLedgerDownloadFormat: (format: LedgerDownloadFormat) => void;
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

  useEffect(() => {
    localStorage.setItem('dateSortingMethod', dateSortingMethod);
  }, [dateSortingMethod]);

  useEffect(() => {
    localStorage.setItem('defaultLedgerDownloadFormat', defaultLedgerDownloadFormat);
  }, [defaultLedgerDownloadFormat]);

  const setDateSortingMethod = (method: DateSortingMethod) => {
    setDateSortingMethodState(method);
  };

  const setDefaultLedgerDownloadFormat = (format: LedgerDownloadFormat) => {
    setDefaultLedgerDownloadFormatState(format);
  };

  return (
    <SettingsContext.Provider value={{
      dateSortingMethod,
      setDateSortingMethod,
      defaultLedgerDownloadFormat,
      setDefaultLedgerDownloadFormat
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
