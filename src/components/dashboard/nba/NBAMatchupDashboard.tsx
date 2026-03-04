import React from 'react';
import { Game } from '../../../data/mockGames';
import { NBAGameLeaders } from './NBAGameLeaders';
import { NBABoxScoreLineup } from './NBABoxScoreLineup';
import { NBANewsAndStandings } from './NBANewsAndStandings';
import { BetPick } from '../../../App';

interface NBAMatchupDashboardProps {
    game: Game;
    onAddBet?: (bet: Omit<BetPick, 'id'>) => void;
}

export const NBAMatchupDashboard: React.FC<NBAMatchupDashboardProps> = ({ game }) => {
    return (
        <div className="space-y-6">
            {/* Real ESPN game leaders */}
            <NBAGameLeaders game={game} />

            {/* Full box score lineup — both teams side by side */}
            <NBABoxScoreLineup game={game} />

            {/* News & standings */}
            <NBANewsAndStandings game={game} />
        </div>
    );
};
