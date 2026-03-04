import React, { createContext, useContext, useState, useEffect } from 'react';

interface LiveBetsContextType {
    isLiveBetsActive: boolean;
    toggleLiveBets: () => void;
}

const LiveBetsContext = createContext<LiveBetsContextType | undefined>(undefined);

export const LiveBetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLiveBetsActive, setIsLiveBetsActive] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('isLiveBetsActive');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });

    useEffect(() => {
        localStorage.setItem('isLiveBetsActive', JSON.stringify(isLiveBetsActive));
    }, [isLiveBetsActive]);

    const toggleLiveBets = () => setIsLiveBetsActive((prev: boolean) => !prev);

    return (
        <LiveBetsContext.Provider value={{ isLiveBetsActive, toggleLiveBets }}>
            {children}
        </LiveBetsContext.Provider>
    );
};

export const useLiveBets = () => {
    const context = useContext(LiveBetsContext);
    if (context === undefined) {
        throw new Error('useLiveBets must be used within a LiveBetsProvider');
    }
    return context;
};
