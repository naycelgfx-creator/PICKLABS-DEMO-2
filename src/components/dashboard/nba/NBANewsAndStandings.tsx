import React, { useMemo } from 'react';
import { Game } from '../../../data/mockGames';
import { getMockNbaNews, generateMockStandings } from '../../../data/mockNbaData';

interface NBANewsAndStandingsProps {
    game: Game;
}

export const NBANewsAndStandings: React.FC<NBANewsAndStandingsProps> = ({ game }) => {
    const news = useMemo(() => getMockNbaNews(game.awayTeam.name, game.homeTeam.name), [game]);
    const standings = useMemo(() => generateMockStandings(game.awayTeam.name, game.homeTeam.name), [game]);

    return (
        <div className="col-span-12 lg:col-span-8 terminal-panel p-6 neon-glow-purple grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* News Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border-muted pb-2">
                    <span className="material-symbols-outlined text-accent-purple text-xl">newspaper</span>
                    <h2 className="text-sm font-black text-text-main uppercase italic tracking-[0.2em]">Latest NBA News</h2>
                </div>
                <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                    {news.map(item => (
                        <div key={item.id} className="bg-white dark:bg-neutral-900/40 p-3 rounded border border-border-muted cursor-pointer hover:border-accent-purple/50 transition-colors group">
                            <p className="text-[10px] text-accent-purple font-bold uppercase mb-1">{item.source} • {item.date}</p>
                            <p className="text-xs font-bold text-text-main group-hover:text-primary transition-colors leading-relaxed">
                                {item.headline}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Standings Section — only the two matchup teams */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border-muted pb-2">
                    <span className="material-symbols-outlined text-accent-purple text-xl">format_list_numbered</span>
                    <h2 className="text-sm font-black text-text-main uppercase italic tracking-[0.2em]">25-26 Standings</h2>
                </div>
                <div className="space-y-3">
                    {standings
                        .filter(t => t.team === game.awayTeam.name || t.team === game.homeTeam.name)
                        .map(team => (
                            <div key={team.team} className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 rounded-full w-6 h-6 flex items-center justify-center">{team.rank}</span>
                                    <span className="text-sm font-black text-text-main uppercase italic tracking-widest">{team.team}</span>
                                    {team.team === game.homeTeam.name && (
                                        <span className="text-[8px] font-black text-slate-500 uppercase border border-border-muted rounded px-1.5 py-0.5">Home</span>
                                    )}
                                    {team.team === game.awayTeam.name && (
                                        <span className="text-[8px] font-black text-slate-500 uppercase border border-border-muted rounded px-1.5 py-0.5">Away</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Record</p>
                                        <p className="text-sm font-black text-primary">{team.wins}-{team.losses}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">GB</p>
                                        <p className="text-sm font-black text-text-main">{team.gb}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
};
