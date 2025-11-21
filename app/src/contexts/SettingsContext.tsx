import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AppSettings } from '../types';

interface SettingsContextType {
  settings: AppSettings | null;
  saveSettings: (settings: AppSettings) => void;
  clearSettings: () => void;
  isConfigured: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    // Load from session storage on mount
    const stored = sessionStorage.getItem('fin_app_settings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const saveSettings = (newSettings: AppSettings) => {
    sessionStorage.setItem('fin_app_settings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  const clearSettings = () => {
    sessionStorage.removeItem('fin_app_settings');
    setSettings(null);
  };

  return (
    <SettingsContext.Provider value={{ settings, saveSettings, clearSettings, isConfigured: !!settings }}>
      {children}
    </SettingsContext.Provider>
  );
};
