import React from 'react';
import { Game } from '../../../data/mockGames';
import { useESPNBoxScore, GameLeader } from '../../../data/useESPNBoxScore';

interface NBAGameLeadersProps {
    game: Game;
}

interface StatRowProps {
    label: string;
    leader: GameLeader | null;
    color?: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, leader, color = 'text-primary' }) => {
    if (!leader) return null;
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-border-muted/40 last:border-0">
            <div className="flex items-center gap-3 min-w-0">
                {leader.headshot ? (
                    <img
                        src={leader.headshot}
                        alt={leader.name}
                        className="w-9 h-9 rounded-full object-cover bg-neutral-800 border border-border-muted flex-shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-neutral-800 border border-border-muted flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-slate-500 text-sm">person</span>
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{label}</p>
                    <p className="text-xs font-bold text-text-main truncate">{leader.name}</p>
                    {leader.summary && (
                        <p className="text-[9px] text-slate-600 font-bold">{leader.summary}</p>
                    )}
                </div>
            </div>
            <div className="flex-shrink-0 text-right ml-3">
                <p className={`text-xl font-black ${color}`}>{leader.value}</p>
                <p className="text-[9px] text-slate-500 font-black uppercase">{leader.label}</p>
            </div>
        </div>
    );
};

const TeamLeadersCard: React.FC<{
    teamName: string;
    teamLogo?: string;
    leaders: {
        points: GameLeader | null;
        rebounds: GameLeader | null;
        assists: GameLeader | null;
        threePointers: GameLeader | null;
        steals: GameLeader | null;
        blocks: GameLeader | null;
    };
}> = ({ teamName, teamLogo, leaders }) => (
    <div className="flex-1">
        <div className="flex items-center gap-3 border-b border-border-muted pb-3 mb-3">
            {teamLogo ? (
                <img src={teamLogo} alt={teamName} className="w-9 h-9 object-contain" />
            ) : (
                <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-500 text-sm">sports_basketball</span>
                </div>
            )}
            <h3 className="font-black text-text-main uppercase italic tracking-widest text-sm">{teamName} Leaders</h3>
        </div>
        <StatRow label="Top Scorer" leader={leaders.points} color="text-primary" />
        <StatRow label="Top Rebounder" leader={leaders.rebounds} color="text-accent-blue" />
        <StatRow label="Top Assists" leader={leaders.assists} color="text-accent-purple" />
        <StatRow label="3-Pointers" leader={leaders.threePointers} color="text-yellow-400" />
        {leaders.steals && <StatRow label="Steals" leader={leaders.steals} color="text-red-400" />}
        {leaders.blocks && <StatRow label="Blocks" leader={leaders.blocks} color="text-orange-400" />}
    </div>
);

export const NBAGameLeaders: React.FC<NBAGameLeadersProps> = ({ game }) => {
    const { data, loading, error } = useESPNBoxScore(game.sport, game.matchupId);

    if (loading) {
        return (
            <div className="terminal-panel p-6 col-span-12 flex items-center justify-center gap-3 text-text-muted min-h-[200px]">
                <span className="material-symbols-outlined animate-spin text-primary">autorenew</span>
                <span className="text-xs font-bold uppercase tracking-widest">Loading game leaders…</span>
            </div>
        );
    }

    if (error || !data) {
        // Graceful fallback — show a placeholder message
        return (
            <div className="terminal-panel p-6 col-span-12">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">social_leaderboard</span>
                    <h2 className="text-xl font-black text-text-main uppercase italic tracking-[0.2em]">Game Leaders</h2>
                </div>
                <div className="flex items-center gap-3 p-4 bg-neutral-900/60 rounded-lg border border-border-muted text-text-muted">
                    <span className="material-symbols-outlined text-slate-500">info</span>
                    <p className="text-xs font-bold">
                        {game.status === 'UPCOMING'
                            ? 'Game leaders will be available once the game begins.'
                            : 'Game leaders unavailable for this matchup.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="terminal-panel p-6 neon-glow-green col-span-12">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">social_leaderboard</span>
                    <h2 className="text-xl font-black text-text-main uppercase italic tracking-[0.2em]">Game Leaders</h2>
                </div>
                {data.finalScore && (
                    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400">
                        <span>{data.away.teamAbbr} <span className="text-text-main text-lg">{data.finalScore.away}</span></span>
                        <span className="text-slate-600">–</span>
                        <span className="text-text-main text-lg">{data.finalScore.home}</span> <span>{data.home.teamAbbr}</span>
                    </div>
                )}
                <span className="text-[9px] px-2.5 py-1 bg-primary/10 text-primary border border-primary/30 rounded-full font-black uppercase tracking-widest">
                    {data.status}
                </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <TeamLeadersCard
                    teamName={data.away.teamName}
                    teamLogo={data.away.teamLogo || game.awayTeam.logo}
                    leaders={data.away}
                />
                <div className="hidden lg:flex items-center justify-center">
                    <div className="h-full w-px bg-border-muted relative">
                        <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-background-dark text-slate-600 font-black text-[10px] italic px-2">VS</span>
                    </div>
                </div>
                <TeamLeadersCard
                    teamName={data.home.teamName}
                    teamLogo={data.home.teamLogo || game.homeTeam.logo}
                    leaders={data.home}
                />
            </div>
        </div>
    );
};
