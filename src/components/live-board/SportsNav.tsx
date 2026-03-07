import React from 'react';
import { SPORTS } from '../../data/mockGames';

// ── Sport logos — 2-tier fallback ────────────────────────────────────────────
// Tier 1 (primary): ESPN CDN — best quality, real league logos for major US sports
// Tier 2 (fallback): CBS Sports SVG CDN — sport category icons (confirmed working)
// Tier 3: Material Symbols icon (always available)
export const SPORT_LOGOS: Record<string, { primary: string; fallback: string }> = {
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
        primary: '/wnba-logo-new.png',
        fallback: 'https://sports.cbsimg.net/fly/images/icon-logos/basketball.svg',
    },
    CFB: {
        primary: '/NCAAF_logo.png',
        fallback: '/NCAAF_logo.png',
    },
    NCAAM: {
        primary: '/CBB_logo.png',
        fallback: '/CBB_logo.png',
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
        primary: '/wbc-logo-new.png',
        fallback: '/wbc-logo-new.png',
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
    NASCAR: {
        primary: '/nascar-header-logo.png',
        fallback: '/racing-flag.png', // using standard fallback if available or relying on material
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
    NCAAM: 'sports_basketball',
    NCAAB: 'sports_baseball',
    NCAAW: 'sports_basketball',
    CFB: 'sports_football',
    NASCAR: 'sports_score', // default material icon
    WBC: 'sports_baseball',
};

interface SportsNavProps {
    activeSport: string;
    onSelectSport: (sport: string) => void;
    activeSports?: Record<string, boolean>;
}

export const SportsNav: React.FC<SportsNavProps> = ({ activeSport, onSelectSport, activeSports }) => {
    return (
        <div className="bg-white dark:bg-neutral-900/40 border-b border-border-muted z-40 w-full overflow-hidden">
            <div className="max-w-[1536px] mx-auto px-2 sm:px-6 py-3 sm:py-4">
                <div className="flex overflow-x-auto scrollbar-hide items-center justify-between xl:justify-center gap-1 sm:gap-2 lg:gap-3 pb-3 sm:pb-2 w-full snap-x">
                    {SPORTS.map(sport => {
                        const entry = SPORT_LOGOS[sport];
                        const primarySrc = entry?.primary;
                        const fallbackSrc = entry?.fallback;
                        const materialIcon = SPORT_ICON_MATERIAL[sport] ?? 'sports';

                        // Default to active if the status hasn't loaded or isn't provided
                        const isInactive = activeSports ? activeSports[sport] === false : false;

                        return (
                            <div
                                key={sport}
                                className={`sport-chip shrink-0 snap-start flex-1 flex flex-col items-center justify-center text-center gap-1.5 p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer border hover:-translate-y-1 hover:shadow-lg hover:grayscale-0 hover:opacity-100 ${activeSport === sport
                                        ? 'bg-neutral-800 border-primary shadow-[0_0_15px_rgba(13,242,13,0.15)] text-white grayscale-0 opacity-100'
                                        : 'bg-[#111] border-neutral-800 text-slate-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-700'
                                    } ${isInactive && activeSport !== sport ? 'grayscale opacity-30' : ''} aspect-square min-w-[76px] sm:min-w-[85px] max-w-[90px] sm:max-w-[110px]`}
                                onClick={() => onSelectSport(sport)}
                                title={isInactive ? 'No games scheduled' : ''}
                            >
                                <span className="relative flex items-center justify-center w-full min-h-[32px] max-h-[44px] sm:max-h-[50px] mb-0.5">
                                    <img
                                        src={primarySrc}
                                        alt={sport}
                                        className="h-full w-full object-contain drop-shadow-md"
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
                                        className="material-symbols-outlined text-[24px] sm:text-[28px] text-text-muted"
                                        style={{ display: 'none' }}
                                    >
                                        {materialIcon}
                                    </span>
                                </span>
                                <span className="text-[10px] sm:text-[11px] leading-none font-black tracking-[0.05em] uppercase w-full px-0.5 truncate">
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
