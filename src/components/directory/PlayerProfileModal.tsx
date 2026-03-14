import React, { useEffect, useState } from 'react';
import { ESPNAthleteListItem } from '../../data/espnScoreboard';
import { clsx } from 'clsx';

// ─── Stat parsing (sport-aware) ───────────────────────────────────────────────
export interface StatItem { label: string; value: string | undefined; }
export interface ParsedStats { items: StatItem[]; seasonLabel: string; }

export interface InjuryStatus {
    status: string;
    shortComment: string;
    date: string;
    details?: {
        type?: string;
        location?: string;
        side?: string;
        returnDate?: string;
    };
}

export interface SplitCategory {
    name: string;
    displayName: string;
    splits: {
        displayName: string;
        stats: string[];
    }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mostRecent = (entries: any[]): { stats: string[]; season?: { displayName?: string } } => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = [...entries].sort((a: any, b: any) =>
        ((b.season as { year?: number })?.year ?? 0) - ((a.season as { year?: number })?.year ?? 0)
    );
    return s[0] ?? { stats: [] };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseStats = (categories: any[], sport: string, posAbbr: string): ParsedStats => {
    if (!categories.length) return { items: [], seasonLabel: '' };
    const vals = (i: number): string[] => mostRecent(categories[i]?.statistics ?? []).stats ?? [];
    const season = (i: number): string => mostRecent(categories[i]?.statistics ?? []).season?.displayName ?? '';

    if (sport === 'basketball') {
        const v = vals(0);
        return {
            seasonLabel: season(0), items: [
                { label: 'PTS', value: v[17] }, { label: 'REB', value: v[11] },
                { label: 'AST', value: v[12] }, { label: 'FG%', value: v[4] },
                { label: '3P%', value: v[6] }, { label: 'FT%', value: v[8] },
                { label: 'STL', value: v[14] }, { label: 'BLK', value: v[13] },
            ]
        };
    }

    if (sport === 'football') {
        const pos = posAbbr.toUpperCase(); const s = season(0);
        if (pos === 'QB') {
            const p = vals(0); const r = vals(1);
            return {
                seasonLabel: s, items: [
                    { label: 'YDS', value: p[4] }, { label: 'TD', value: p[6] },
                    { label: 'INT', value: p[7] }, { label: 'RTG', value: p[10] },
                    { label: 'CMP%', value: p[3] }, { label: 'RuYDS', value: r[2] },
                    { label: 'RuTD', value: r[4] }, { label: 'GP', value: p[0] },
                ]
            };
        }
        if (['RB', 'FB'].includes(pos)) {
            const r = vals(1); const rc = vals(2);
            return {
                seasonLabel: s, items: [
                    { label: 'RuYDS', value: r[2] }, { label: 'RuTD', value: r[4] },
                    { label: 'YPC', value: r[3] }, { label: 'REC', value: rc[1] },
                    { label: 'ReYDS', value: rc[3] }, { label: 'ReTD', value: rc[5] },
                    { label: 'YPR', value: rc[4] }, { label: 'GP', value: r[0] },
                ]
            };
        }
        if (['WR', 'TE'].includes(pos)) {
            const rc = vals(2);
            return {
                seasonLabel: s, items: [
                    { label: 'REC', value: rc[1] }, { label: 'YDS', value: rc[3] },
                    { label: 'TD', value: rc[5] }, { label: 'YPR', value: rc[4] },
                    { label: 'TGT', value: rc[2] }, { label: 'LONG', value: rc[6] },
                    { label: '1DN', value: rc[7] }, { label: 'GP', value: rc[0] },
                ]
            };
        }
        const d = vals(3);
        return {
            seasonLabel: s, items: [
                { label: 'TKLS', value: d[1] }, { label: 'SOLO', value: d[2] },
                { label: 'SACKS', value: d[4] }, { label: 'INT', value: d[8] },
                { label: 'PD', value: d[13] }, { label: 'FF', value: d[5] },
                { label: 'FR', value: d[6] }, { label: 'GP', value: d[0] },
            ]
        };
    }

    if (sport === 'baseball') {
        const pos = posAbbr.toUpperCase();
        const isPitcher = ['SP', 'RP', 'P', 'CL'].includes(pos);
        if (isPitcher) {
            const v = vals(0);
            return {
                seasonLabel: season(0), items: [
                    { label: 'ERA', value: v[6] }, { label: 'WHIP', value: v[7] },
                    { label: 'W', value: v[2] }, { label: 'L', value: v[3] },
                    { label: 'K', value: v[9] }, { label: 'BB', value: v[10] },
                    { label: 'IP', value: v[8] }, { label: 'GP', value: v[0] },
                ]
            };
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const battingCat = categories.find((c: any) => (c.displayName ?? '').toLowerCase().includes('batting')) ?? categories[0];
        const entry = mostRecent(battingCat?.statistics ?? []);
        const v = entry.stats ?? [];
        return {
            seasonLabel: entry.season?.displayName ?? '', items: [
                { label: 'AVG', value: v[13] }, { label: 'HR', value: v[6] },
                { label: 'RBI', value: v[7] }, { label: 'OPS', value: v[16] },
                { label: 'OBP', value: v[14] }, { label: 'SLG', value: v[15] },
                { label: 'R', value: v[2] }, { label: 'H', value: v[3] },
            ]
        };
    }

    if (sport === 'hockey') {
        const pos = posAbbr.toUpperCase();
        const v = vals(0);
        if (['G', 'GK'].includes(pos)) {
            return {
                seasonLabel: season(0), items: [
                    { label: 'GP', value: v[0] }, { label: 'W', value: v[2] },
                    { label: 'L', value: v[3] }, { label: 'GAA', value: v[7] },
                    { label: 'SV%', value: v[8] }, { label: 'SO', value: v[9] },
                    { label: 'GA', value: v[5] }, { label: 'SA', value: v[6] },
                ]
            };
        }
        return {
            seasonLabel: season(0), items: [
                { label: 'PTS', value: v[3] },
                { label: 'G', value: v[1] },
                { label: 'A', value: v[2] },
                { label: '+/-', value: v[4] },
                { label: 'SH%', value: v[7] ? `${v[7]}%` : undefined },
                { label: 'PPG', value: v[8] },
                { label: 'PIM', value: v[5] },
                { label: 'GP', value: v[0] },
            ]
        };
    }

    // Generic fallback
    const v = vals(0); const names: string[] = categories[0]?.names ?? [];
    return {
        seasonLabel: season(0), items: names.slice(0, 8).map((n: string, i: number) => ({
            label: n.replace(/([A-Z])/g, ' $1').trim().toUpperCase().slice(0, 5),
            value: v[i],
        }))
    };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDOB = (dob?: string): string => {
    if (!dob) return 'N/A';
    try { const d = new Date(dob); return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`; }
    catch { return dob; }
};

/** Returns a CSS colour string that has enough contrast against the given bg */
const contrastColor = (hex?: string): string => {
    if (!hex) return '#ffffff';
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55 ? '#000000' : '#ffffff';
};

// ─── Component ────────────────────────────────────────────────────────────────
interface PlayerProfileModalProps {
    athlete: ESPNAthleteListItem;
    sport: string;
    league: string;
    onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ athlete, sport, league, onClose }) => {
    const [parsed, setParsed] = useState<ParsedStats>({ items: [], seasonLabel: '' });
    const [injury, setInjury] = useState<InjuryStatus | null>(null);
    const [splits, setSplits] = useState<SplitCategory[]>([]);
    
    // For the UI split tabs
    const [activeTab, setActiveTab] = useState<'season' | 'matchup' | 'location'>('season');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        (async () => {
            try {
                const [statsRes, athleteRes, splitsRes] = await Promise.all([
                    fetch(`https://site.web.api.espn.com/apis/common/v3/sports/${sport}/${league}/athletes/${athlete.id}/stats`),
                    fetch(`https://site.api.espn.com/apis/common/v3/sports/${sport}/${league}/athletes/${athlete.id}`),
                    fetch(`https://site.web.api.espn.com/apis/common/v3/sports/${sport}/${league}/athletes/${athlete.id}/splits`)
                ]);

                if (statsRes.ok) {
                    const data = await statsRes.json();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const cats: any[] = data?.categories ?? [];
                    setParsed(parseStats(cats, sport, athlete.position?.abbreviation ?? ''));
                }

                if (athleteRes.ok) {
                    const data = await athleteRes.json();
                    if (data.athlete?.injuries && data.athlete.injuries.length > 0) {
                        setInjury(data.athlete.injuries[0]);
                    }
                }

                if (splitsRes.ok) {
                    const data = await splitsRes.json();
                    if (data.splitCategories) {
                        setSplits(data.splitCategories);
                    }
                }
            } catch { /* leave empty */ }
            setLoading(false);
        })();
    }, [athlete.id, athlete.position?.abbreviation, sport, league]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    const headshot = athlete.headshot?.href;
    const pos = athlete.position?.abbreviation || 'N/A';
    const primaryBg = athlete.teamColor ? `#${athlete.teamColor}` : '#1a1a2e';
    const borderClr = athlete.teamAltColor ? `#${athlete.teamAltColor}` : '#444';
    const textClr = contrastColor(athlete.teamColor);
    const hasStats = parsed.items.some(s => s.value);

    // Filter relevant splits
    const matchupSplits = splits.find(s => s.name === 'byOpponent')?.splits || [];
    const locationSplits = splits.find(s => s.name === 'byLocation')?.splits || [];

    // Map stats indices based on sport
    const getSplitStatVal = (sport: string, statIdx: number, item: any) => {
        if (!item.stats) return '—';
        if (sport === 'basketball') {
            // In splits: points is 16, reb is 10, ast is 11 for NBA
            const idxMap: Record<number, number> = { 0: 16, 1: 10, 2: 11, 3: 4, 4: 6, 5: 8, 6: 14, 7: 13 };
            return item.stats[idxMap[statIdx] ?? 0] ?? '—';
        }
        // Add other sports split mappings if needed, for now fallback to the same array idx
        return item.stats[statIdx] ?? '—';
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto pt-24 pb-12"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)] my-auto flex-shrink-0"
                style={{ background: primaryBg, border: `3px solid ${borderClr}` }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── X close ── */}
                <button
                    onClick={onClose}
                    title="Close"
                    aria-label="Close"
                    className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-black/45 border hover:bg-black/60"
                    style={{ borderColor: borderClr, color: textClr }}
                >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
                </button>

                {/* ── Hero ── */}
                <div className="relative h-56 flex items-end justify-center overflow-hidden">

                    {/* Team logo — full colour, NO blur, large watermark */}
                    {athlete.teamLogo && (
                        <img
                            src={athlete.teamLogo}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-contain opacity-55 scale-105"
                        />
                    )}

                    {/* Subtle vignette so headshot pops */}
                    <div
                        className="absolute inset-0 z-10"
                        style={{ background: `radial-gradient(ellipse at center bottom, transparent 40%, ${primaryBg}99 100%)` }}
                    />

                    {/* Player headshot — layered on top */}
                    {headshot ? (
                        <img
                            src={headshot}
                            alt={athlete.displayName}
                            className="relative z-20 h-56 w-auto object-cover object-top drop-shadow-2xl"
                        />
                    ) : (
                        <div className="relative z-20 w-28 h-28 rounded-full flex items-center justify-center mb-4 bg-black/30">
                            <span className="material-symbols-outlined text-5xl" style={{ color: textClr }}>person</span>
                        </div>
                    )}
                </div>

                {/* ── Info Panel ── */}
                <div className="px-5 pt-3 pb-5 flex flex-col gap-4 bg-black/60">

                    {/* Name row */}
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-black leading-tight" style={{ color: textClr === '#ffffff' ? '#ffffff' : '#111' }}>{athlete.displayName}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className="text-xs font-black px-2 py-0.5 rounded"
                                    style={{ background: borderClr, color: contrastColor(athlete.teamAltColor) }}
                                >{pos}</span>
                                {athlete.jersey && <span className="text-xs font-bold text-white/70">#{athlete.jersey}</span>}
                                {athlete.teamAbbr && <span className="text-xs font-bold text-white/60 uppercase">{athlete.teamAbbr}</span>}
                            </div>
                        </div>
                        {athlete.teamLogo && (
                            <img
                                src={athlete.teamLogo}
                                alt={athlete.teamAbbr ? `${athlete.teamAbbr} Logo` : 'Team Logo'}
                                className="w-12 h-12 object-contain shrink-0 drop-shadow-lg"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                        )}
                    </div>

                    {/* Injury Banner */}
                    {injury && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 relative overflow-hidden flex gap-3 text-red-50">
                            <div className="shrink-0 pt-0.5">
                                <span className="material-symbols-outlined text-red-400 text-[18px]">medical_services</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-0.5">{injury.status} {injury.details?.type ? `- ${injury.details.type}` : ''}</h4>
                                <p className="text-xs leading-tight font-medium text-red-100/90">{injury.shortComment}</p>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-black/40 rounded-lg border" style={{ borderColor: `${borderClr}44` }}>
                        {(['season', 'matchup', 'location'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={clsx(
                                    "flex-1 text-[10px] font-black uppercase tracking-wider py-2 rounded transition-colors text-center",
                                    activeTab === tab 
                                        ? "bg-white/10 text-white shadow-sm" 
                                        : "text-white/40 hover:text-white/70 hover:bg-white/5"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[160px]">
                        {loading && (
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="h-2 w-8 rounded animate-pulse bg-white/10" />
                                        <div className="h-5 w-10 rounded animate-pulse bg-white/10" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && activeTab === 'season' && (
                            <div className="animate-in fade-in duration-300">
                                {/* Physical bio */}
                                <div
                                    className="grid grid-cols-3 gap-3 text-center rounded-xl p-3 bg-black/40 mb-4"
                                    style={{ border: `1px solid ${borderClr}44` }}
                                >
                                    {[
                                        { lbl: 'Birthday', val: fmtDOB(athlete.dateOfBirth) },
                                        { lbl: 'Height', val: athlete.displayHeight || 'N/A' },
                                        { lbl: 'Weight', val: athlete.displayWeight || 'N/A' },
                                    ].map(({ lbl, val }) => (
                                        <div key={lbl}>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-0.5">{lbl}</p>
                                            <p className="text-[11px] font-bold text-white">{val}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-px flex-1" style={{ background: borderClr + '66' }} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
                                        {parsed.seasonLabel ? `${parsed.seasonLabel} Stats` : 'Season Stats'}
                                    </span>
                                    <div className="h-px flex-1" style={{ background: borderClr + '66' }} />
                                </div>
                                {hasStats ? (
                                    <div className="grid grid-cols-4 gap-2">
                                        {parsed.items.map(({ label, value }) => (
                                            <div
                                                key={label}
                                                className="flex flex-col items-center text-center rounded-lg py-2 px-1 bg-black/30"
                                                style={{ border: `1px solid ${borderClr}55` }}
                                            >
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white/50 mb-1">{label}</span>
                                                <span className="text-base font-black text-white leading-none">{value ?? '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 py-3 text-white/40 text-xs">
                                        <span className="material-symbols-outlined text-base">bar_chart</span>
                                        Stats not available
                                    </div>
                                )}
                            </div>
                        )}

                        {!loading && activeTab === 'matchup' && (
                            <div className="animate-in fade-in slide-in-from-right-2 duration-300 flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1 pb-4 custom-scrollbar">
                                {matchupSplits.length > 0 ? matchupSplits.map((split, i) => (
                                    <div key={i} className="bg-black/40 border rounded-lg p-3" style={{ borderColor: `${borderClr}44` }}>
                                        <div className="text-[11px] font-black uppercase tracking-wide text-white mb-2 pb-2 border-b border-white/10">
                                            {split.displayName}
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {parsed.items.slice(0, 4).map((pi, idx) => (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <span className="text-[8px] font-bold text-white/40 uppercase">{pi.label}</span>
                                                    <span className="text-sm font-black text-white">{getSplitStatVal(sport, idx, split)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-white/40 text-xs py-8">No matchup data available</div>
                                )}
                            </div>
                        )}

                        {!loading && activeTab === 'location' && (
                            <div className="animate-in fade-in slide-in-from-right-2 duration-300 flex flex-col gap-2">
                                {locationSplits.length > 0 ? locationSplits.map((split, i) => (
                                    <div key={i} className="bg-black/40 border rounded-lg p-3" style={{ borderColor: `${borderClr}44` }}>
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                            <span className="material-symbols-outlined text-[16px] text-white/60">
                                                {split.displayName === 'Home' ? 'home' : 'flight_takeoff'}
                                            </span>
                                            <span className="text-[11px] font-black uppercase tracking-wide text-white">
                                                {split.displayName} Splits
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 border-t border-b border-black/20 py-1 bg-black/20 rounded">
                                            {parsed.items.slice(0, 4).map((pi, idx) => (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <span className="text-[8px] font-bold text-white/40 uppercase">{pi.label}</span>
                                                    <span className="text-sm font-black text-white">{getSplitStatVal(sport, idx, split)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 pt-2">
                                            {parsed.items.slice(4, 8).map((pi, idx) => (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <span className="text-[8px] font-bold text-white/40 uppercase">{pi.label}</span>
                                                    <span className="text-[11px] font-black text-white/80">{getSplitStatVal(sport, idx+4, split)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-white/40 text-xs py-8">No location splits available</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
