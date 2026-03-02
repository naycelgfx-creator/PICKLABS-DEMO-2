import React, { useState } from 'react';
import { SPORT_LOGOS } from '../../data/mockGames';
import { PlayerPropsModule } from '../props/PlayerPropsModule';
import { RosterAndStats } from './RosterAndStats';
import { TeamOverview } from './TeamOverview';
import { DepthChart } from './DepthChart';
import { TeamSchedule } from './TeamSchedule';

interface Team {
    id?: string;
    name: string;
    abbr: string;
    url?: string;
}

interface TeamDetailsProps {
    team: Team;
    sport: string;
    onBack: () => void;
}

const TABS = [
    { key: 'overview', label: 'Overview', icon: 'analytics' },
    { key: 'schedule', label: 'Schedule', icon: 'calendar_month' },
    { key: 'roster', label: 'Roster', icon: 'group' },
    { key: 'depth', label: 'Depth', icon: 'schema' },
    { key: 'props', label: 'Props', icon: 'sports' },
] as const;

type TabKey = typeof TABS[number]['key'];

export const TeamDetails: React.FC<TeamDetailsProps> = ({ team, sport, onBack }) => {
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    return (
        <div className="w-full flex justify-center bg-background-dark min-h-screen">
            <div className="max-w-[1536px] w-full flex flex-col gap-4 px-3 sm:px-6 py-4 sm:py-8">

                {/* ── Back Button & Team Header ── */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer group shrink-0"
                    >
                        <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-background-light rounded-xl flex items-center justify-center border border-border-muted p-1.5 shadow-[0_0_20px_rgba(57,255,20,0.1)] shrink-0">
                            <img
                                src={team.url}
                                alt={team.name}
                                className="w-full h-full object-contain drop-shadow-lg"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = SPORT_LOGOS[sport];
                                }}
                            />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl sm:text-3xl font-black text-white uppercase italic tracking-tight truncate">{team.name}</h2>
                                {SPORT_LOGOS[sport] && (
                                    <img src={SPORT_LOGOS[sport]} alt={sport} className="w-4 h-4 opacity-60 hidden sm:block" />
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted font-medium">
                                <span className="bg-neutral-800 px-2 py-0.5 flex items-center rounded text-[10px] gap-1 border border-border-muted">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    {sport}
                                </span>
                                <span className="text-slate-500">{team.abbr.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Navigation Tabs — scrollable on mobile ── */}
                <div className="overflow-x-auto -mx-3 sm:mx-0 scrollbar-none">
                    <div className="flex items-center gap-1 sm:gap-2 border-b border-border-muted pb-0 px-3 sm:px-0 min-w-max sm:min-w-0">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors pb-3 pt-1 px-2 sm:px-3 relative whitespace-nowrap
                                    ${activeTab === tab.key
                                        ? (tab.key === 'props' ? 'text-accent-secondary' : 'text-primary')
                                        : 'text-slate-500 hover:text-text-main'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">{tab.icon}</span>
                                <span className="hidden xs:inline sm:inline">{tab.label}</span>
                                <span className="xs:hidden sm:hidden">{tab.label.slice(0, 3)}</span>
                                {activeTab === tab.key && (
                                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full shadow-[0_0_10px_rgba(57,255,20,0.5)]
                                        ${tab.key === 'props' ? 'bg-accent-secondary' : 'bg-primary'}`}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Content Area ── */}
                <div className="animate-fade-in py-1">
                    {activeTab === 'overview' && (
                        <TeamOverview teamName={team.name} abbr={team.abbr} sport={sport} />
                    )}
                    {activeTab === 'schedule' && (
                        <TeamSchedule teamName={team.name} sport={sport} />
                    )}
                    {activeTab === 'roster' && (
                        <RosterAndStats teamName={team.id || team.name} sport={sport} />
                    )}
                    {activeTab === 'depth' && (
                        <DepthChart teamName={team.name} sport={sport} />
                    )}
                    {activeTab === 'props' && (
                        <PlayerPropsModule sport={sport} team={team} />
                    )}
                </div>

            </div>
        </div>
    );
};
