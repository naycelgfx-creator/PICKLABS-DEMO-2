/**
 * PlayerSearchWidget — Global cross-league player search
 *
 * Uses playerDB (7,500+ ESPN players: NBA, NFL, MLB, NHL, NCAAW, NCAAB, CFB)
 * to provide instant autocomplete with real ESPN headshots.
 *
 * Usage:
 *   <PlayerSearchWidget onSelect={(player) => console.log(player)} />
 */
import React, { useState, useRef, useEffect } from 'react';
import { searchPlayers, Player, playerCount } from '../../data/playerDB';

const LEAGUE_LABELS: Record<string, string> = {
    'nba': 'NBA',
    'nfl': 'NFL',
    'mlb': 'MLB',
    'nhl': 'NHL',
    'womens-college-basketball': 'NCAAW',
    'mens-college-basketball': 'NCAAB',
    'college-football': 'CFB',
};

interface Props {
    onSelect?: (player: Player) => void;
    placeholder?: string;
    leagueFilter?: string;
    className?: string;
}

export const PlayerSearchWidget: React.FC<Props> = ({
    onSelect,
    placeholder = `Search ${playerCount.toLocaleString()} players…`,
    leagueFilter,
    className = '',
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Player[]>([]);
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) { setResults([]); setOpen(false); return; }
        const id = setTimeout(() => {
            const found = searchPlayers(query, leagueFilter, 12);
            setResults(found);
            setOpen(found.length > 0);
            setFocused(-1);
        }, 120);
        return () => clearTimeout(id);
    }, [query, leagueFilter]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!dropRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleKey = (e: React.KeyboardEvent) => {
        if (!open) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
        if (e.key === 'Enter' && focused >= 0) { e.preventDefault(); pick(results[focused]); }
        if (e.key === 'Escape') setOpen(false);
    };

    const pick = (player: Player) => {
        setQuery('');
        setOpen(false);
        setResults([]);
        onSelect?.(player);
    };

    return (
        <div ref={dropRef} className={`relative ${className}`}>
            {/* Input */}
            <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[16px] text-slate-500 pointer-events-none">
                    search
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => { if (results.length > 0) setOpen(true); }}
                    onKeyDown={handleKey}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-text-main placeholder-slate-600
                               focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
                        className="absolute right-3 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {open && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl shadow-black/60 overflow-hidden max-h-[320px] overflow-y-auto">
                    {results.map((player, idx) => {
                        const isFocused = idx === focused;
                        const leagueLabel = LEAGUE_LABELS[player.league] ?? player.league.toUpperCase();
                        return (
                            <button
                                key={player.id}
                                onMouseDown={() => pick(player)}
                                onMouseEnter={() => setFocused(idx)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${isFocused ? 'bg-primary/10' : 'hover:bg-white/5'
                                    } ${idx > 0 ? 'border-t border-neutral-800' : ''}`}
                            >
                                {/* Headshot */}
                                <img
                                    src={player.headshot}
                                    alt={player.name}
                                    className="w-8 h-8 rounded-full object-cover object-top bg-neutral-800 border border-neutral-700 shrink-0"
                                    onError={e => {
                                        const el = e.target as HTMLImageElement;
                                        el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=27272a&color=888&size=64&bold=true`;
                                    }}
                                />
                                {/* Name + meta */}
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-black text-text-main truncate">{player.name}</p>
                                    <p className="text-[9px] text-slate-500 font-bold truncate">
                                        {player.teamName}
                                        {player.position && ` · ${player.position}`}
                                        {player.jersey && ` · #${player.jersey}`}
                                    </p>
                                </div>
                                {/* League badge */}
                                <span className="shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-slate-500">
                                    {leagueLabel}
                                </span>
                            </button>
                        );
                    })}

                    {/* Footer hint */}
                    <div className="px-4 py-2 border-t border-neutral-800 flex items-center justify-between">
                        <span className="text-[9px] text-slate-600">↑↓ navigate · Enter select · Esc close</span>
                        <span className="text-[9px] text-slate-600">{playerCount.toLocaleString()} players indexed</span>
                    </div>
                </div>
            )}
        </div>
    );
};
