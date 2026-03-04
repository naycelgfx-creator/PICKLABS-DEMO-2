import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AIRiskMode = 'safe' | 'balanced' | 'aggressive';

export interface PickLabsSettings {
    enabledSports: string[];
    aiRiskMode: AIRiskMode;
    defaultBetSize: number;
    notificationsEnabled: boolean;
    bugModeEnabled: boolean;
    minConfidence: number;
}

interface SettingsContextType {
    settings: PickLabsSettings;
    updateSettings: (newSettings: Partial<PickLabsSettings>) => void;
    resetSettings: () => void;
}

const DEFAULT_SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAAB', 'NCAAF', 'Tennis', 'PGA'];

const DEFAULT_SETTINGS: PickLabsSettings = {
    enabledSports: DEFAULT_SPORTS,
    aiRiskMode: 'balanced',
    defaultBetSize: 50,
    notificationsEnabled: true,
    bugModeEnabled: false,
    minConfidence: 50,
};

const SETTINGS_STORAGE_KEY = 'picklabs_user_settings';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<PickLabsSettings>(() => {
        try {
            const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults in case we add new settings later
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch {
            console.warn("Could not load settings from localStorage");
        }
        return DEFAULT_SETTINGS;
    });

    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch {
            console.warn("Could not save settings to localStorage");
        }
    }, [settings]);

    const updateSettings = (newSettings: Partial<PickLabsSettings>) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
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
