/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RookieModeContextType {
    isRookieModeActive: boolean;
    toggleRookieMode: () => boolean; // Returns true if activated successfully, false if quota exceeded
    hasSeenTour: boolean;
    markTourSeen: () => void;

    // Quota System
    quotaUses: number;
    hasExceededQuota: boolean;
    incrementQuota: () => boolean; // Returns true if allowed, false if exceeded
}

const RookieModeContext = createContext<RookieModeContextType | undefined>(undefined);

const MAX_FREE_USES = 20;
const QUOTA_DAYS = 7;

interface QuotaState {
    uses: number;
    startDate: string;
}

export const RookieModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isRookieModeActive, setIsRookieModeActive] = useState<boolean>(false);
    const [hasSeenTour, setHasSeenTour] = useState<boolean>(
        () => localStorage.getItem('picklabs_rookie_tour_seen') === 'true'
    );

    // --- Quota Management ---
    const [quotaState, setQuotaState] = useState<QuotaState>(() => {
        const stored = localStorage.getItem('picklabs_free_quota');
        if (stored) {
            try {
                const parsed: QuotaState = JSON.parse(stored);
                // Check if 7 days have passed to reset
                const startDate = new Date(parsed.startDate);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - startDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > QUOTA_DAYS) {
                    // Reset quota
                    return { uses: 0, startDate: new Date().toISOString() };
                }
                return parsed;
            } catch {
                return { uses: 0, startDate: new Date().toISOString() };
            }
        }
        return { uses: 0, startDate: new Date().toISOString() };
    });

    const hasExceededQuota = quotaState.uses >= MAX_FREE_USES;

    const incrementQuota = (): boolean => {
        if (hasExceededQuota) return false;

        const newState = { ...quotaState, uses: quotaState.uses + 1 };
        setQuotaState(newState);
        localStorage.setItem('picklabs_free_quota', JSON.stringify(newState));
        return true;
    };

    const toggleRookieMode = (): boolean => {
        if (!isRookieModeActive) {
            // Trying to turn it ON
            if (!incrementQuota()) {
                return false; // Failed to turn on due to quota
            }
        }
        setIsRookieModeActive(prev => !prev);
        return true;
    };

    const markTourSeen = () => {
        setHasSeenTour(true);
        localStorage.setItem('picklabs_rookie_tour_seen', 'true');
    };

    return (
        <RookieModeContext.Provider value={{
            isRookieModeActive,
            toggleRookieMode,
            hasSeenTour,
            markTourSeen,
            quotaUses: quotaState.uses,
            hasExceededQuota,
            incrementQuota
        }}>
            {children}
        </RookieModeContext.Provider>
    );
};

export const useRookieMode = (): RookieModeContextType => {
    const context = useContext(RookieModeContext);
    if (!context) {
        throw new Error('useRookieMode must be used within a RookieModeProvider');
    }
    return context;
};
