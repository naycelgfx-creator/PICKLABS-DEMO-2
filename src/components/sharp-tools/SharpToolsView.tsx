import React, { useState } from 'react';
import { ArbitrageFinder } from './ArbitrageFinder';
import { EVOpportunities } from './EVOpportunities';
import { SharpFlow } from './SharpFlow';
import { ActiveSharpMatchups } from './ActiveSharpMatchups';
import { SharpIntelligenceFeed } from './SharpIntelligenceFeed';
import { Game } from '../../data/mockGames';
import { fetchESPNScoreboardByDate, SportKey } from '../../data/espnScoreboard';
import { espnGameToGame } from '../live-board/LiveBoard';

export const SharpToolsView: React.FC<{ selectedGame?: Game | null }> = ({ selectedGame }) => {
    const [liveGames, setLiveGames] = useState<Game[]>(selectedGame ? [selectedGame] : []);
    const [activeGame, setActiveGame] = useState<Game | null>(selectedGame || null);
    const [isLoading, setIsLoading] = useState(!selectedGame);

    React.useEffect(() => {
        if (selectedGame) return;

        const loadRealGames = async () => {
            const today = new Date().toISOString().split('T')[0];
            const espnKey: SportKey = 'NBA'; // Default to NBA if no game selected
            try {
                const raw = await fetchESPNScoreboardByDate(espnKey, today);
                if (raw.length > 0) {
                    const games = raw.map(eg => espnGameToGame(eg));
                    setLiveGames(games);
                    setActiveGame(games[0]);
                }
            } catch (e) {
                console.error("Failed to load live games for Sharp Tools", e);
            } finally {
                setIsLoading(false);
            }
        };

        loadRealGames();
    }, [selectedGame]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
                    <p className="text-sm font-black text-text-muted uppercase tracking-[0.2em]">Aggregating Sharp Data...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="max-w-[1440px] mx-auto p-6 space-y-6">
            <div className="grid grid-cols-12 gap-6">
                <ArbitrageFinder game={activeGame} />
                <EVOpportunities game={activeGame} />
                <SharpFlow />
            </div>

            <div className="grid grid-cols-12 gap-6">
                <ActiveSharpMatchups game={activeGame} games={liveGames} onGameSelect={setActiveGame} />
                <SharpIntelligenceFeed />
            </div>
        </main>
    );
};
