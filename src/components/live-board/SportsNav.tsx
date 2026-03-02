import React from 'react';
import { SPORTS } from '../../data/mockGames';

// ── Sport logos — 2-tier fallback ────────────────────────────────────────────
// Tier 1 (primary): ESPN CDN — best quality, real league logos for major US sports
// Tier 2 (fallback): CBS Sports SVG CDN — sport category icons (confirmed working)
// Tier 3: Material Symbols icon (always available)
const SPORT_LOGOS: Record<string, { primary: string; fallback: string }> = {
    NBA: {
        primary: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
        fallback: 'https://sports.cbsimg.net/fly/images/icon-logos/basketball.svg',
    },
    NFL: {
        primary: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
        fallback: 'https://sports.cbsimg.net/fly/images/icon-logos/football.svg',
    },
    MLB: {
        primary: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
        fallback: 'https://sports.cbsimg.net/fly/images/icon-logos/baseball.svg',
    },
    NHL: {
        primary: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
        fallback: 'https://sports.cbsimg.net/fly/images/icon-logos/hockey.svg',
    },
    WNBA: {
        primary: 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
        fallback: 'https://sports.cbsimg.net/fly/images/icon-logos/basketball.svg',
    },
    CFB: {
        primary: '/NCAAF_logo.png',
        fallback: '/NCAAF_logo.png',
    },
    NCAAB: {
        primary: '/NCAAB_logo.png',
        fallback: '/NCAAB_logo.png',
    },
    NCAAW: {
        primary: '/NCAAW_logo.png',
        fallback: '/NCAAW_logo.png',
    },
    // Soccer/Tennis/Golf — CBS Sports SVGs confirmed working
    Soccer: {
        primary: '/FIFA-Logo.svg',
        fallback: '/FIFA-Logo.svg',
    },
    WBC: {
        primary: '/wbc-logo.png',
        fallback: '/wbc-logo.png',
    },
    Tennis: {
        primary: '/Wimbledon.svg.png',
        fallback: '/Wimbledon.svg.png',
    },
    Golf: {
        primary: '/pga_tour.png',
        fallback: '/pga_tour.png',
    },
    UFC: {
        primary: 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png',
        fallback: 'https://sports.cbsimg.net/fly/images/icon-logos/boxing.svg',
    },
    Esports: {
        primary: 'https://a.espncdn.com/i/teamlogos/leagues/500/esports.png',
        fallback: 'https://sports.cbsimg.net/fly/images/icon-logos/esports.svg',
    },
};

// Material Symbols icon — last-resort fallback
const SPORT_ICON_MATERIAL: Record<string, string> = {
    NBA: 'sports_basketball',
    NFL: 'sports_football',
    MLB: 'sports_baseball',
    NHL: 'sports_hockey',
    WNBA: 'sports_basketball',
    Soccer: 'sports_soccer',
    Tennis: 'sports_tennis',
    Golf: 'sports_golf',
    UFC: 'sports_mma',
    Esports: 'sports_esports',
    NCAAB: 'sports_basketball',
    NCAAW: 'sports_basketball',
    CFB: 'sports_football',
};

interface SportsNavProps {
    activeSport: string;
    onSelectSport: (sport: string) => void;
}

export const SportsNav: React.FC<SportsNavProps> = ({ activeSport, onSelectSport }) => {
    return (
        <div className="bg-white dark:bg-neutral-900/40 border-b border-border-muted z-40 w-full">
            <div className="max-w-[1536px] mx-auto px-2 sm:px-6 py-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:flex lg:flex-wrap items-center justify-center gap-2 sm:gap-3 xl:gap-8 pb-2">
                    {SPORTS.map(sport => {
                        const entry = SPORT_LOGOS[sport];
                        const primarySrc = entry?.primary;
                        const fallbackSrc = entry?.fallback;
                        const materialIcon = SPORT_ICON_MATERIAL[sport] ?? 'sports';
                        return (
                            <div
                                key={sport}
                                className={`sport-chip flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-1 sm:gap-2 px-2 py-2 rounded-lg transition-all cursor-pointer ${activeSport === sport ? 'bg-primary/20 text-primary border border-primary/40' : 'text-slate-400 hover:text-white border border-transparent'}`}
                                onClick={() => onSelectSport(sport)}
                            >
                                <span className="relative flex items-center justify-center w-4 h-4 shrink-0">
                                    <img
                                        src={primarySrc}
                                        alt={sport}
                                        className="h-4 w-4 object-contain"
                                        onError={e => {
                                            const img = e.currentTarget;
                                            if (fallbackSrc && img.src !== fallbackSrc) {
                                                // Try CBS Sports SVG fallback
                                                img.src = fallbackSrc;
                                            } else {
                                                // Last resort: Material Symbols icon
                                                img.style.display = 'none';
                                                const icon = img.nextElementSibling as HTMLElement | null;
                                                if (icon) icon.style.display = 'inline';
                                            }
                                        }}
                                    />
                                    <span
                                        className="material-symbols-outlined text-[20px] sm:text-[14px] text-text-muted"
                                        style={{ display: 'none' }}
                                    >
                                        {materialIcon}
                                    </span>
                                </span>
                                <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                    {sport === 'CFB' ? "NCAAF" : sport}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
