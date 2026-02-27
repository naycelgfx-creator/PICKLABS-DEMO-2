import React from 'react';
import { Game } from '../../../data/mockGames';
import { NBAGameLeaders } from './NBAGameLeaders';
import { NBABoxScoreLineup } from './NBABoxScoreLineup';
import { NBAShotChart } from './NBAShotChart';
import { NBATeamStats } from './NBATeamStats';
import { NBANewsAndStandings } from './NBANewsAndStandings';
import { BetPick } from '../../../App';

interface NBAMatchupDashboardProps {
    game: Game;
    onAddBet?: (bet: Omit<BetPick, 'id'>) => void;
}

export const NBAMatchupDashboard: React.FC<NBAMatchupDashboardProps> = ({ game }) => {
    return (
        <div className="space-y-6">
            {/* Game leaders summary */}
            <NBAGameLeaders game={game} />

            {/* Full box score lineup — both teams side by side */}
            <NBABoxScoreLineup game={game} />

            {/* Shot chart + team stats */}
            <div className="grid grid-cols-12 gap-6">
                <NBAShotChart game={game} />
                <NBATeamStats game={game} />
            </div>

            <NBANewsAndStandings game={game} />
        </div>
    );
};
