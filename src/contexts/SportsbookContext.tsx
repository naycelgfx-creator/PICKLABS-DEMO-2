import React, { createContext, useContext, useState, useCallback } from 'react';

// ── Sportsbook definitions ──────────────────────────────────────────────────
export interface Sportsbook {
    id: string;
    name: string;
    shortName: string;
    domain: string;
    color: string;        // brand button BG color
    textColor: string;    // button text color
    category: 'sportsbook' | 'dfs' | 'other'; // for tab filtering
}

export const SPORTSBOOKS: Sportsbook[] = [
    // ── Sportsbooks ──
    { id: 'fanduel', name: 'FanDuel', shortName: 'FanDuel', domain: 'fanduel.com', color: '#0052A3', textColor: '#ffffff', category: 'sportsbook' },
    { id: 'draftkings', name: 'DraftKings', shortName: 'DraftKings', domain: 'draftkings.com', color: '#4F9000', textColor: '#ffffff', category: 'sportsbook' },
    { id: 'hardrock', name: 'Hard Rock Bet', shortName: 'Hard Rock', domain: 'hardrock.bet', color: '#5D2C87', textColor: '#ffffff', category: 'sportsbook' },
    { id: 'betmgm', name: 'BetMGM', shortName: 'BetMGM', domain: 'betmgm.com', color: '#B89456', textColor: '#000000', category: 'sportsbook' },
    { id: 'bet365', name: 'Bet365', shortName: 'Bet365', domain: 'bet365.com', color: '#027B5B', textColor: '#ffffff', category: 'sportsbook' },
    { id: 'caesars', name: 'Caesars', shortName: 'Caesars', domain: 'caesars.com', color: '#C5B358', textColor: '#000000', category: 'sportsbook' },
    { id: 'thescore', name: 'theScore Bet', shortName: 'theScore', domain: 'thescore.bet', color: '#1B99D6', textColor: '#ffffff', category: 'sportsbook' },
    { id: 'betrivers', name: 'BetRivers', shortName: 'BetRivers', domain: 'betrivers.com', color: '#C8892A', textColor: '#000000', category: 'sportsbook' },
    { id: 'novig', name: 'Novig', shortName: 'Novig', domain: 'novig.com', color: '#1A1A2E', textColor: '#ffffff', category: 'sportsbook' },
    { id: 'prophetx', name: 'ProphetX', shortName: 'ProphetX', domain: 'prophetx.com', color: '#111111', textColor: '#ffffff', category: 'sportsbook' },
    // ── DFS ──
    { id: 'prizepicks', name: 'PrizePicks', shortName: 'PrizePicks', domain: 'prizepicks.com', color: '#6C3EBF', textColor: '#ffffff', category: 'dfs' },
    { id: 'underdog', name: 'Underdog', shortName: 'Underdog', domain: 'underdogfantasy.com', color: '#2D2D2D', textColor: '#ffffff', category: 'dfs' },
    { id: 'sleeper', name: 'Sleeper', shortName: 'Sleeper', domain: 'sleeper.app', color: '#1C1C2E', textColor: '#ffffff', category: 'dfs' },
    // ── Other ──
    { id: 'fliff', name: 'Fliff', shortName: 'Fliff', domain: 'getfliff.com', color: '#E63946', textColor: '#ffffff', category: 'other' },
    { id: 'kalshi', name: 'Kalshi', shortName: 'Kalshi', domain: 'kalshi.com', color: '#2B2B2B', textColor: '#ffffff', category: 'other' },
];

// ── Context types ───────────────────────────────────────────────────────────
interface SportsbookContextType {
    enabledBooks: Record<string, boolean>;
    toggleBook: (id: string) => void;
    isBookEnabled: (id: string) => boolean;
    enabledSportsbooks: Sportsbook[];
    enableAll: () => void;
    disableAll: () => void;
}

const SportsbookContext = createContext<SportsbookContextType | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────────────────────
export const SportsbookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [enabledBooks, setEnabledBooks] = useState<Record<string, boolean>>(
        () => Object.fromEntries(SPORTSBOOKS.map((b, index) => [b.id, index < 4]))
    );

    const toggleBook = useCallback((id: string) => {
        setEnabledBooks(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const isBookEnabled = useCallback((id: string) => {
        return enabledBooks[id] ?? true;
    }, [enabledBooks]);

    const enabledSportsbooks = SPORTSBOOKS.filter(b => enabledBooks[b.id]);

    const enableAll = useCallback(() => {
        setEnabledBooks(Object.fromEntries(SPORTSBOOKS.map(b => [b.id, true])));
    }, []);

    const disableAll = useCallback(() => {
        setEnabledBooks(Object.fromEntries(SPORTSBOOKS.map(b => [b.id, false])));
    }, []);

    return (
        <SportsbookContext.Provider value={{ enabledBooks, toggleBook, isBookEnabled, enabledSportsbooks, enableAll, disableAll }}>
            {children}
        </SportsbookContext.Provider>
    );
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useSportsbooks = () => {
    const ctx = useContext(SportsbookContext);
    if (!ctx) throw new Error('useSportsbooks must be used within SportsbookProvider');
    return ctx;
};
