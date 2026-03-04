import React, { createContext, useContext, useState } from 'react';
import { SPORTS } from '../data/mockGames';
import { SportKey } from '../data/espnScoreboard';

interface SportContextType {
    activeSport: string;
    setActiveSport: (sport: string) => void;
    activeSoccerLeague: SportKey;
    setActiveSoccerLeague: (league: SportKey) => void;
    activeTennisTour: SportKey;
    setActiveTennisTour: (tour: SportKey) => void;
}

const SportContext = createContext<SportContextType | undefined>(undefined);

export const SportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeSport, setActiveSport] = useState<string>(SPORTS[0]);
    const [activeSoccerLeague, setActiveSoccerLeague] = useState<SportKey>('Soccer.EPL');
    const [activeTennisTour, setActiveTennisTour] = useState<SportKey>('Tennis.ATP');

    return (
        <SportContext.Provider
            value={{
                activeSport,
                setActiveSport,
                activeSoccerLeague,
                setActiveSoccerLeague,
                activeTennisTour,
                setActiveTennisTour
            }}
        >
            {children}
        </SportContext.Provider>
    );
};

export const useSportContext = () => {
    const context = useContext(SportContext);
    if (!context) {
        throw new Error('useSportContext must be used within a SportProvider');
    }
    return context;
};
