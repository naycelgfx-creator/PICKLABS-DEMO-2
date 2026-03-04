import React, { useRef, useState, useEffect, useCallback } from 'react';
import { fetchGameCountsByDate, APP_SPORT_TO_ESPN, SportKey } from '../../data/espnScoreboard';

// Generate array of dates: 2 past days → today → 12 future days
const generateDates = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = -2; i <= 12; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(toLocalDateStr(d));
    }
    return dates;
};

const toLocalDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const todayStr = toLocalDateStr(new Date());

interface DateFilterProps {
    selectedDate: string; // YYYY-MM-DD
    onSelectDate: (date: string) => void;
    activeSport?: string; // to fetch real game counts
}

export const DateFilter: React.FC<DateFilterProps> = ({ selectedDate, onSelectDate, activeSport }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const dates = generateDates();
    const [gameCounts, setGameCounts] = useState<Record<string, number>>({});
    const [loadingCounts, setLoadingCounts] = useState(false);

    const espnSport = activeSport ? APP_SPORT_TO_ESPN[activeSport] : null;

    const fetchCounts = useCallback(async () => {
        if (!espnSport) {
            setGameCounts({});
            return;
        }
        setLoadingCounts(true);
        try {
            const counts = await fetchGameCountsByDate(espnSport as SportKey, dates);
            setGameCounts(counts);
        } catch {
            setGameCounts({});
        } finally {
            setLoadingCounts(false);
        }
    }, [espnSport]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    // Auto-scroll today into view
    useEffect(() => {
        const el = scrollRef.current?.querySelector('[data-today="true"]') as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, []);

    const formatDay = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        if (dateStr === todayStr) return 'Today';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatWeekday = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'short' });
    };

    const isPast = (dateStr: string) => dateStr < todayStr;

    return (
        <div className="w-full bg-background-dark border-b border-border-muted relative mb-4">
            <div className="max-w-[1536px] mx-auto px-6">
                <div
                    ref={scrollRef}
                    className="overflow-x-auto flex items-center gap-1 scrollbar-hide py-2"
                >
                    <div className="flex gap-3 min-w-max">
                        {dates.map((dateStr) => {
                            const isSelected = selectedDate === dateStr;
                            const isToday = dateStr === todayStr;
                            const past = isPast(dateStr);
                            const count = gameCounts[dateStr] ?? 0;
                            const hasGames = count > 0;

                            return (
                                <button
                                    key={dateStr}
                                    data-today={isToday ? 'true' : undefined}
                                    onClick={() => onSelectDate(dateStr)}
                                    className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-150 min-w-[60px]
                                        ${isSelected
                                            ? 'bg-primary/10 border border-primary/30 text-white'
                                            : past
                                                ? 'text-slate-600 hover:text-slate-400 border border-transparent hover:border-white/5'
                                                : 'text-text-muted hover:text-text-main border border-transparent hover:border-white/5'
                                        }`}
                                >
                                    {/* Selected top bar */}
                                    {isSelected && (
                                        <div className="absolute top-0 left-2 right-2 h-0.5 bg-primary rounded-b-sm"></div>
                                    )}

                                    {/* Day name */}
                                    <span className={`text-[13px] whitespace-nowrap font-black ${isToday ? 'text-primary' : ''}`}>
                                        {formatDay(dateStr)}
                                    </span>

                                    {/* Weekday */}
                                    <span className="text-[10px] uppercase tracking-wider font-semibold mt-0.5 opacity-60">
                                        {formatWeekday(dateStr)}
                                    </span>

                                    {/* Game count dots */}
                                    {!loadingCounts && (
                                        <div className="flex gap-0.5 mt-1 h-1.5 items-center">
                                            {hasGames ? (
                                                <>
                                                    {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary' : past ? 'bg-slate-700' : 'bg-slate-500'}`}
                                                        ></div>
                                                    ))}
                                                    {count > 5 && (
                                                        <span className="text-[8px] text-slate-600 font-bold">+</span>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="w-1 h-1"></div>
                                            )}
                                        </div>
                                    )}
                                    {loadingCounts && (
                                        <div className="w-4 h-1 mt-1 bg-neutral-800 rounded animate-pulse"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background-dark to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background-dark to-transparent pointer-events-none"></div>
        </div>
    );
};
