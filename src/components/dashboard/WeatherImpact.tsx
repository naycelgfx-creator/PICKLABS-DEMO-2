import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Game } from '../../data/mockGames';
import { WeatherConditionIcon, type WeatherCondition } from '../ui/animated-weather-icons';

interface WeatherImpactProps {
    game: Game;
}

// ── Sports that play outdoors ──────────────────────────────────────────
const OUTDOOR_SPORTS = ['NFL', 'MLB', 'Soccer', 'Tennis', 'Golf'];

// ── Sport-specific weather impact text ────────────────────────────────
function getImpactText(
    condition: WeatherCondition,
    windSpeed: number,
    windDir: string,
    temp: number,
    sport: string
): { text: string; level: 'low' | 'medium' | 'high' } {
    // Thunder/heavy rain always high impact for any outdoor sport
    if (condition === 'Thunder' || condition === 'HeavyRain') {
        return { text: `Thunder/heavy precipitation severely limits ${sport === 'Golf' ? 'play (potential suspension)' : 'scoring and increases turnover risk'}.`, level: 'high' };
    }

    if (sport === 'NFL') {
        if (windSpeed > 20) return { text: `Wind ${windSpeed} mph forces both teams to abandon the pass game. Heavy Under play — target rushing props.`, level: 'high' };
        if (condition === 'Snow') return { text: 'Snow makes footing treacherous, reduces passing accuracy. Fumble props and Unders become premium.', level: 'high' };
        if (condition === 'Rain') return { text: 'Wet ball increases drops and fumbles. Consider Under and ball-security-focused props.', level: 'medium' };
        if (temp < 25) return { text: 'Extreme cold impacts kicking game accuracy and QB throwing performance.', level: 'medium' };
    }

    if (sport === 'MLB') {
        if (windSpeed > 15 && windDir.toLowerCase().includes('out')) return { text: `${windSpeed} mph wind blowing ${windDir} strongly favors home runs — play the Over.`, level: 'high' };
        if (windSpeed > 15 && windDir.toLowerCase().includes('in')) return { text: `${windSpeed} mph wind blowing in from ${windDir} suppresses offense — lean hard Under.`, level: 'high' };
        if (temp > 88) return { text: 'Heat reduces air density — ball carries further. Subtle Over lean and HR props.', level: 'medium' };
        if (condition === 'Rain') return { text: 'Rain may delay or suspend game. Check weather windows before betting.', level: 'high' };
    }

    if (sport === 'Soccer') {
        if (condition === 'Rain' && windSpeed > 15) return { text: 'Heavy rain and wind reduce ball control and technical play. Back physical teams and the Under.', level: 'high' };
        if (condition === 'Snow') return { text: 'Snow pitch conditions favor direct play. Possession-based teams lose edge.', level: 'high' };
        if (temp > 88) return { text: 'High heat increases fatigue. Expect late-game opportunities — target 2nd half lines.', level: 'medium' };
        if (windSpeed > 18) return { text: 'Strong crosswinds disrupt passing and long balls. Expect more direct play.', level: 'medium' };
    }

    if (sport === 'Tennis') {
        if (windSpeed > 15) return { text: `Wind ${windSpeed} mph above 15 mph significantly disrupts serve accuracy and consistent ball-tossing. Neutral/defensive baseliners gain edge.`, level: 'high' };
        if (condition === 'Sunny' && temp > 90) return { text: 'Extreme heat can cause deceleration late in matches. Shorter set totals or set betting.', level: 'medium' };
        if (condition === 'Cloudy') return { text: 'Overcast conditions suit heavy-hitting players (no sun glare). Big server advantage.', level: 'low' };
    }

    if (sport === 'Golf') {
        if (windSpeed > 20) return { text: `Gale-force winds (${windSpeed} mph) make scoring extremely difficult. Target higher scoring totals and play long-shot values.`, level: 'high' };
        if (windSpeed > 10) return { text: `Wind ${windSpeed} mph will punish aggressive lines. Course management separates field — back precision drivers.`, level: 'medium' };
        if (condition === 'Rain') return { text: 'Soft greens hold shots longer — aggressive approach styles gain edge. Lower scoring likely.', level: 'medium' };
        if (condition === 'Sunny' && temp > 85) return { text: 'Fast firm greens reduce spin control. Premium on accuracy — fade putting totals if available.', level: 'low' };
    }

    // Generic low impact
    return { text: 'Minimal weather impact expected. Standard lines apply.', level: 'low' };
}

// ── Deterministic weather from game ID ────────────────────────────────
function hashStr(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
    return h;
}

function getWeather(game: Game): {
    temp: number; condition: WeatherCondition; windSpeed: number; windDir: string;
} {
    const seed = hashStr(game.matchupId ?? game.awayTeam.name + game.homeTeam.name);
    const temps = [24, 38, 48, 62, 72, 80, 88, 95];
    const temp = temps[seed % temps.length];

    const windSpeeds = [4, 8, 12, 18, 24, 30];
    const windSpeed = windSpeeds[(seed >> 3) % windSpeeds.length];
    const windDirs = ['NW', 'NE', 'SW', 'SE', 'In from Center', 'Out to Left', 'Out to Right'];
    const windDir = windDirs[(seed >> 6) % windDirs.length];

    // Pick condition based on temp & seed
    let condition: WeatherCondition;
    const bucket = (seed >> 9) % 12;
    if (temp < 32) {
        condition = [bucket < 5 ? 'Snow' : 'Cloudy'][0] as WeatherCondition;
    } else if (temp < 48) {
        const opts: WeatherCondition[] = ['Rain', 'Cloudy', 'Fog', 'PartlyCloudy', 'Wind'];
        condition = opts[bucket % opts.length];
    } else if (temp > 85) {
        const opts: WeatherCondition[] = ['Sunny', 'PartlyCloudy', 'Thunder', 'Sunny', 'Sunny'];
        condition = opts[bucket % opts.length];
    } else {
        const opts: WeatherCondition[] = ['Sunny', 'PartlyCloudy', 'Cloudy', 'Rain', 'Wind', 'Fog', 'HeavyRain'];
        condition = opts[bucket % opts.length];
    }

    return { temp, condition, windSpeed, windDir };
}

// ── Condition label ───────────────────────────────────────────────────
const CONDITION_LABELS: Record<WeatherCondition, string> = {
    Sunny: 'Sunny', PartlyCloudy: 'Partly Cloudy', Cloudy: 'Cloudy',
    Rain: 'Rain', HeavyRain: 'Heavy Rain', Snow: 'Snow',
    Thunder: 'Thunderstorm', Wind: 'Windy', Fog: 'Foggy',
    Sunrise: 'Clear Morning', ClearNight: 'Clear Night', Rainbow: 'Post-Rain',
};

// ── Impact color helpers ──────────────────────────────────────────────
const IMPACT_COLORS = {
    high: 'bg-red-500/20 text-red-400 border-red-500/50',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    low: 'bg-green-500/20 text-green-400 border-green-500/50',
};

// ─────────────────────────────────────────────────────────────────────
export const WeatherImpact: React.FC<WeatherImpactProps> = ({ game }) => {
    if (!OUTDOOR_SPORTS.includes(game.sport)) return null;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { temp, condition, windSpeed, windDir } = useMemo(() => getWeather(game), [game]);
    const { text: impactText, level: impactLevel } = getImpactText(condition, windSpeed, windDir, temp, game.sport);

    const sportLabel: Record<string, string> = {
        NFL: '🏈 NFL', MLB: '⚾ MLB', Soccer: '⚽ Soccer', Tennis: '🎾 Tennis', Golf: '⛳ Golf',
    };

    return (
        <div className="terminal-panel mt-6 relative overflow-visible group">
            {/* ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent pointer-events-none rounded-xl" />

            {/* Header */}
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-white/5 relative z-10">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-sm">thermostat</span>
                    Weather Impact · {sportLabel[game.sport] ?? game.sport}
                </h3>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${IMPACT_COLORS[impactLevel]}`}>
                    {impactLevel} Impact
                </span>
            </div>

            {/* Body */}
            <div className="p-6 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

                {/* Animated weather icon + temp */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center p-5 bg-white dark:bg-neutral-900/40 rounded-xl border border-border-muted/50 gap-3"
                >
                    <WeatherConditionIcon condition={condition} size={60} />
                    <span className="text-2xl font-black text-text-main">{temp}°F</span>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                        {CONDITION_LABELS[condition]}
                    </span>
                </motion.div>

                {/* Wind stats */}
                <div className="flex flex-col p-5 bg-white dark:bg-neutral-900/40 rounded-xl border border-border-muted/50 justify-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-sm">air</span>
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Wind Factor</h4>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-2xl font-black text-text-main">
                                {windSpeed} <span className="text-sm text-slate-500 font-normal">mph</span>
                            </span>
                            <p className="text-[10px] text-text-muted font-bold uppercase mt-1">Speed</p>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-black text-blue-300">{windDir}</span>
                            <p className="text-[10px] text-text-muted font-bold uppercase mt-1">Direction</p>
                        </div>
                    </div>
                    {/* Wind bar */}
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5">
                        <motion.div
                            className="h-1.5 rounded-full bg-blue-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((windSpeed / 35) * 100, 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                {/* Betting edge */}
                <div className="flex flex-col p-5 bg-blue-900/10 rounded-xl border border-blue-500/30 justify-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400 text-sm">analytics</span>
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Betting Edge</h4>
                    </div>
                    <p className="text-sm text-text-muted font-medium leading-relaxed">{impactText}</p>
                </div>
            </div>
        </div>
    );
};
