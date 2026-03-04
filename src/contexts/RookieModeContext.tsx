import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getCurrentUser } from '../data/PickLabsAuthDB';

interface RookieModeContextType {
    isRookieModeActive: boolean;
    toggleRookieMode: () => boolean; // Returns true if activated successfully, false if quota exceeded
    hasSeenTour: boolean;
    markTourSeen: () => void;

    // Quota System
    quotaUses: number;
    quotaRemaining: number;
    quotaStartDate: string;
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
    const getStorageKey = () => {
        const user = getCurrentUser();
        return user ? `picklabs_free_quota_${user.userId}` : 'picklabs_free_quota_anon';
    };

    const [quotaState, setQuotaState] = useState<QuotaState>(() => {
        const key = getStorageKey();
        const stored = localStorage.getItem(key);
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

    // Re-initialize state when user changes (e.g. login/logout)
    useEffect(() => {
        const key = getStorageKey();
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setQuotaState(parsed);
            } catch {
                setQuotaState({ uses: 0, startDate: new Date().toISOString() });
            }
        } else {
            setQuotaState({ uses: 0, startDate: new Date().toISOString() });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getCurrentUser()?.userId]);

    const hasExceededQuota = quotaState.uses >= MAX_FREE_USES;

    const incrementQuota = (): boolean => {
        if (hasExceededQuota) return false;

        const newState = { ...quotaState, uses: quotaState.uses + 1 };
        setQuotaState(newState);
        localStorage.setItem(getStorageKey(), JSON.stringify(newState));
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
            quotaRemaining: Math.max(0, MAX_FREE_USES - quotaState.uses),
            quotaStartDate: quotaState.startDate,
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
