import React, { useMemo } from 'react';
import { Game } from '../../data/mockGames';

// Extract this into a reusable stateless ui component later
const StatBar = ({ value, color }: { value: string; color: string }) => (
    <div className="w-24 h-1.5 bg-neutral-800 rounded-full inline-block overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: value }}></div>
    </div>
);

interface OffenseVsDefenseProps {
    game: Game;
}

export const OffenseVsDefense: React.FC<OffenseVsDefenseProps> = ({ game }) => {
    // Generate synthetic but context-aware mock metrics
    const metrics = useMemo(() => {
        // Base seed using string lengths & ids for consistency per matchup
        const seedValue = game.awayTeam.name.length + game.homeTeam.name.length;

        return [
            {
                label: 'Points Per Game',
                away: Number((115 + (seedValue % 5)).toFixed(1)),
                home: Number((112 + (seedValue % 6)).toFixed(1)),
                isPercent: false,
                percentile: 88 + (seedValue % 10)
            },
            {
                label: 'Effective FG%',
                away: Number((54.0 + (seedValue % 3)).toFixed(1)),
                home: Number((52.5 + ((seedValue + 1) % 3)).toFixed(1)),
                isPercent: true,
                percentile: 92 - (seedValue % 5)
            },
            {
                label: 'Total Rebounds',
                away: Number((42.5 + (seedValue % 4)).toFixed(1)),
                home: Number((44.0 + (seedValue % 5)).toFixed(1)),
                isPercent: false,
                percentile: 45 + (seedValue % 20)
            },
            {
                label: 'Turnover %',
                away: Number((13.5 - (seedValue % 2)).toFixed(1)),
                home: Number((12.1 + (seedValue % 3)).toFixed(1)),
                isPercent: true,
                percentile: 76 + (seedValue % 12)
            }
        ];
    }, [game.awayTeam.name, game.homeTeam.name]);

    return (
        <div className="terminal-panel overflow-hidden h-full">
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">analytics</span>
                    Offense vs. Defense Matchup
                </h3>
                <div className="flex gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 font-bold uppercase">{game.awayTeam.name.substring(0, 3)} Offense</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-accent-purple/20 text-accent-purple border border-accent-purple/30 font-bold uppercase">{game.homeTeam.name.substring(0, 3)} Defense</span>
                </div>
            </div>
            <div className="p-0">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-border-muted">
                            <th className="px-6 py-3 text-left">Metric Category</th>
                            <th className="px-6 py-3 text-center">{game.awayTeam.name.substring(0, 3).toUpperCase()} (Off)</th>
                            <th className="px-6 py-3 text-center">{game.homeTeam.name.substring(0, 3).toUpperCase()} (Def)</th>
                            <th className="px-6 py-3 text-center">Edge</th>
                            <th className="px-6 py-3 text-right">League Percentile</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-muted">
                        {metrics.map((metric, idx) => {
                            const diff = Number((metric.away - metric.home).toFixed(1));
                            const isAwayEdge = diff > 0;
                            // For Turnovers, a lower number is better
                            const isActualAwayEdge = metric.label === 'Turnover %' ? diff < 0 : isAwayEdge;

                            return (
                                <tr key={idx} className="stat-grid-row">
                                    <td className="px-6 py-4 font-bold text-text-muted">{metric.label}</td>
                                    <td className="px-6 py-4 text-text-main text-center">{metric.away}{metric.isPercent ? '%' : ''}</td>
                                    <td className="px-6 py-4 text-text-main text-center">{metric.home}{metric.isPercent ? '%' : ''}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`font-bold ${isActualAwayEdge ? 'text-primary' : 'text-accent-purple'}`}>
                                            {diff > 0 ? '+' : ''}{diff}{metric.isPercent ? '%' : ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <StatBar value={`${metric.percentile}%`} color={isActualAwayEdge ? 'bg-primary' : 'bg-accent-purple'} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
