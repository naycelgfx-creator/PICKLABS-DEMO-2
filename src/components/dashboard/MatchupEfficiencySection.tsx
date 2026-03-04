// Shared Matchup Efficiency bar component used across all sport field panels
import React from 'react';
import { Game } from '../../data/mockGames';

// ─── Reusable bar ─────────────────────────────────────────────────────────────
export const EffBar: React.FC<{
    label: string;
    awayVal: string;
    homeVal: string;
    awayPct: number;  // 0-100
    homePct: number;  // 0-100
    awayColor: string;
    homeColor: string;
}> = ({ label, awayVal, homeVal, awayPct, homePct, awayColor, homeColor }) => (
    <div className="space-y-1">
        <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500">
            <span className="text-slate-300 font-black">{awayVal}</span>
            <span>{label}</span>
            <span className="text-slate-300 font-black">{homeVal}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex gap-px bg-neutral-900">
            <div className="h-full rounded-l-full transition-all duration-1000" style={{ width: `${awayPct}%`, background: awayColor }} />
            <div className="flex-1" />
            <div className="h-full rounded-r-full transition-all duration-1000" style={{ width: `${homePct}%`, background: homeColor }} />
        </div>
    </div>
);

// ─── Grouped efficiency section ───────────────────────────────────────────────
export const MatchupEfficiencySection: React.FC<{
    game: Game;
    icon: string;
    title?: string;
    rows: Array<{
        label: string;
        awayVal: string;
        homeVal: string;
        awayPct: number;
        homePct: number;
    }>;
    footNote?: string;
}> = ({ game, icon, title = 'Matchup Efficiency', rows, footNote }) => (
    <div className="border-t border-border-muted bg-accent-purple/5 p-6">
        <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-accent-purple text-xl">{icon}</span>
            <h2 className="text-sm font-black text-text-main uppercase italic tracking-[0.2em]">{title}</h2>
        </div>

        {/* Team headers */}
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                {game.awayTeam.logo && <img src={game.awayTeam.logo} alt="" className="w-7 h-7 object-contain" />}
                <span className="text-xs font-black text-text-main uppercase truncate max-w-[120px]">{game.awayTeam.name}</span>
            </div>
            <span className="text-[9px] text-slate-600 font-black uppercase">vs</span>
            <div className="flex items-center gap-2 flex-row-reverse">
                {game.homeTeam.logo && <img src={game.homeTeam.logo} alt="" className="w-7 h-7 object-contain" />}
                <span className="text-xs font-black text-text-main uppercase truncate max-w-[120px]">{game.homeTeam.name}</span>
            </div>
        </div>

        <div className="space-y-3">
            {rows.map(r => (
                <EffBar
                    key={r.label}
                    label={r.label}
                    awayVal={r.awayVal}
                    homeVal={r.homeVal}
                    awayPct={r.awayPct}
                    homePct={r.homePct}
                    awayColor="#3b82f6"
                    homeColor="#0ca810"
                />
            ))}
        </div>

        {footNote && (
            <p className="text-center text-[9px] text-slate-600 font-bold italic mt-4">
                {footNote}
            </p>
        )}
    </div>
);
