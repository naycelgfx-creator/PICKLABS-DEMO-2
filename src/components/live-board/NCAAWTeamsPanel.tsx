/**
 * NCAAWTeamsPanel — Women's College Basketball
 * Shows top programs with ESPN-sourced team logos and real player headshots
 * via the ESPN combiner CDN (mirrors Python AthleteImageTool.get_player_headshot).
 *
 * URL pattern: https://a.espncdn.com/combiner/i?img=/i/headshots/womens-college-basketball/players/full/{id}.png&w=350&h=254
 */
import React, { useState } from 'react';
import { logos } from '../../data/sportsLogoTool';

// ESPN combiner headshot for NCAAW players — matches Python AthleteImageTool exactly
const wbbHeadshot = (espnId: number) =>
    logos.getPlayerHeadshot('basketball', 'womens-college-basketball', espnId, 'full');

interface NCAAWPlayer {
    name: string;
    espnId: number;     // ESPN athlete ID → headshot via combiner CDN
    pos: string;
    year: string;       // Fr, So, Jr, Sr
    ppg: string;
    highlight: string;
}

interface NCAAWProgram {
    id: number;         // ESPN team ID (NCAA CDN)
    name: string;
    shortName: string;
    conference: string;
    rank?: number;
    record: string;
    primaryColor: string;
    players: NCAAWPlayer[];
}

// ESPN NCAA team IDs — used for: https://a.espncdn.com/i/teamlogos/ncaa/500/{id}.png
// ESPN player IDs for NCAAW — used for combiner headshot CDN
const NCAAW_PROGRAMS: NCAAWProgram[] = [
    {
        id: 2579, name: 'South Carolina Gamecocks', shortName: 'S. Carolina', conference: 'SEC',
        rank: 1, record: '31-1', primaryColor: '#73000A',
        players: [
            { name: 'Te-Hina Paopao',   espnId: 4433797, pos: 'G', year: 'Sr', ppg: '14.2', highlight: 'SEC Defensive Player of the Year candidate' },
            { name: 'Chloe Kitts',       espnId: 5121055, pos: 'F', year: 'Jr', ppg: '12.8', highlight: 'Elite low-post scorer & rebounder' },
        ],
    },
    {
        id: 41, name: 'Connecticut Huskies', shortName: 'UConn', conference: 'Big East',
        rank: 2, record: '29-3', primaryColor: '#0E1A6E',
        players: [
            { name: 'Paige Bueckers',   espnId: 4433790, pos: 'G', year: 'Sr', ppg: '22.0', highlight: '2025 Wooden Award favorite — consensus #1 pick' },
            { name: 'Sarah Strong',      espnId: 5239592, pos: 'F', year: 'Fr', ppg: '15.3', highlight: 'AP Freshman of the Year candidate' },
        ],
    },
    {
        id: 2294, name: 'Iowa Hawkeyes', shortName: 'Iowa', conference: 'Big Ten',
        rank: 3, record: '27-5', primaryColor: '#FFCD00',
        players: [
            { name: 'Lucy Olsen',        espnId: 4682968, pos: 'G', year: 'Jr', ppg: '18.6', highlight: 'Led Iowa into post-Caitlin Clark era' },
            { name: 'Hannah Stuelke',    espnId: 4433985, pos: 'C', year: 'Jr', ppg: '12.4', highlight: 'Elite post presence & shot-blocker' },
        ],
    },
    {
        id: 99, name: 'LSU Tigers', shortName: 'LSU', conference: 'SEC',
        rank: 4, record: '25-7', primaryColor: '#461D7C',
        players: [
            { name: 'Aneesah Morrow',   espnId: 4565525, pos: 'F', year: 'Jr', ppg: '22.4', highlight: 'Back-to-back scoring & rebounding champion' },
            { name: "Flau'jae Johnson", espnId: 4698736, pos: 'G', year: 'Jr', ppg: '15.0', highlight: 'Recording artist & star guard' },
        ],
    },
    {
        id: 275, name: 'Stanford Cardinal', shortName: 'Stanford', conference: 'ACC',
        rank: 5, record: '26-6', primaryColor: '#8C1515',
        players: [
            { name: 'Talana Lepolo',    espnId: 5174674, pos: 'G', year: 'Jr', ppg: '12.7', highlight: 'Elite two-way guard' },
            { name: 'Nunu Agara',       espnId: 4858655, pos: 'F', year: 'Jr', ppg: '11.2', highlight: 'Interior anchor' },
        ],
    },
    {
        id: 87, name: 'Notre Dame Fighting Irish', shortName: 'Notre Dame', conference: 'ACC',
        rank: 6, record: '26-6', primaryColor: '#0C2340',
        players: [
            { name: 'Hannah Hidalgo',   espnId: 5174674, pos: 'G', year: 'Jr', ppg: '19.8', highlight: 'Led nation in steals two straight seasons' },
            { name: 'Olivia Miles',      espnId: 4702867, pos: 'G', year: 'Sr', ppg: '16.4', highlight: 'Elite playmaker & point guard' },
        ],
    },
    {
        id: 251, name: 'Texas Longhorns', shortName: 'Texas', conference: 'SEC',
        rank: 7, record: '26-7', primaryColor: '#BF5700',
        players: [
            { name: 'Madison Booker',   espnId: 5175792, pos: 'G', year: 'So', ppg: '16.2', highlight: 'Big 12 Freshman of the Year 2024' },
            { name: 'Aaliyah Moore',    espnId: 4433523, pos: 'F', year: 'Sr', ppg: '11.8', highlight: 'Veteran interior presence' },
        ],
    },
    {
        id: 150, name: 'NC State Wolfpack', shortName: 'NC State', conference: 'ACC',
        rank: 8, record: '25-8', primaryColor: '#CC0000',
        players: [
            { name: 'Aziaha James',     espnId: 4698736, pos: 'G', year: 'Sr', ppg: '21.1', highlight: 'ACC Player of the Year candidate' },
            { name: 'River Baldwin',    espnId: 4432522, pos: 'C', year: 'Sr', ppg: '10.6', highlight: 'Shot-blocking anchor' },
        ],
    },
    {
        id: 194, name: 'Ohio State Buckeyes', shortName: 'Ohio State', conference: 'Big Ten',
        rank: 9, record: '27-5', primaryColor: '#BA0C2F',
        players: [
            { name: 'Jaloni Cambridge', espnId: 5239683, pos: 'G', year: 'Fr', ppg: '18.4', highlight: '#1 recruit in 2024 class' },
            { name: 'Cotie McMahon',    espnId: 5105435, pos: 'G', year: 'Jr', ppg: '13.5', highlight: 'Multi-year All Big Ten performer' },
        ],
    },
    {
        id: 52, name: 'Duke Blue Devils', shortName: 'Duke', conference: 'ACC',
        rank: 10, record: '26-7', primaryColor: '#012169',
        players: [
            { name: 'Oluwabusayo Efude', espnId: 5238277, pos: 'F', year: 'Sr', ppg: '14.1', highlight: 'Efficient scorer & rebounder' },
            { name: 'Reigan Richardson', espnId: 4894357, pos: 'G', year: 'Jr', ppg: '12.0', highlight: 'Three-point specialist' },
        ],
    },
];

function getTeamLogoUrl(espnId: number): string {
    return `https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`;
}

function getConferenceColor(conf: string): string {
    const map: Record<string, string> = {
        'SEC': '#1a4a2e',
        'Big East': '#1a2a4a',
        'Big Ten': '#1a3a5c',
        'ACC': '#0d2137',
        'Big 12': '#2a1a0a',
    };
    return map[conf] ?? '#1a1a2a';
}

// Player headshot with fallback to initials avatar
const PlayerAvatar: React.FC<{ player: NCAAWPlayer; size?: string }> = ({ player, size = 'w-10 h-10' }) => {
    const [failed, setFailed] = useState(false);
    const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2);
    if (failed) {
        return (
            <div className={`${size} rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0`}>
                <span className="text-[11px] font-black text-slate-400">{initials}</span>
            </div>
        );
    }
    return (
        <img
            src={wbbHeadshot(player.espnId)}
            alt={player.name}
            className={`${size} rounded-full object-cover object-top border border-neutral-700 bg-neutral-800 shrink-0`}
            onError={() => setFailed(true)}
        />
    );
};

export const NCAAWTeamsPanel: React.FC = () => {
    const [selectedProgram, setSelectedProgram] = useState<NCAAWProgram | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConference, setSelectedConference] = useState<string>('All');

    const conferences = ['All', 'SEC', 'Big East', 'Big Ten', 'ACC', 'Big 12'];

    const filtered = NCAAW_PROGRAMS.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
            || p.shortName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchConf = selectedConference === 'All' || p.conference === selectedConference;
        return matchSearch && matchConf;
    });

    if (selectedProgram) {
        return (
            <div className="space-y-4">
                {/* Back button */}
                <button
                    onClick={() => setSelectedProgram(null)}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-text-main transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    All Programs
                </button>

                {/* Program header */}
                <div
                    className="terminal-panel p-5 border border-neutral-700/60"
                    style={{ background: `linear-gradient(135deg, ${selectedProgram.primaryColor}22, #0d1117)` }}
                >
                    <div className="flex items-center gap-4">
                        <img
                            src={getTeamLogoUrl(selectedProgram.id)}
                            alt={selectedProgram.name}
                            className="w-16 h-16 object-contain drop-shadow-lg"
                            onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                        />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {selectedProgram.rank && (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
                                        #{selectedProgram.rank} AP
                                    </span>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded text-slate-400 border border-neutral-700">
                                    {selectedProgram.conference}
                                </span>
                            </div>
                            <h2 className="text-xl font-black text-text-main uppercase tracking-wide">{selectedProgram.name}</h2>
                            <p className="text-sm text-slate-400 font-bold">{selectedProgram.record} · Women's Basketball</p>
                        </div>
                    </div>
                </div>

                {/* Star players with real ESPN headshots */}
                <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">Key Players</h3>
                    {selectedProgram.players.map(player => (
                        <div key={player.name} className="terminal-panel p-4 border border-neutral-700/40 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <PlayerAvatar player={player} size="w-12 h-12" />
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-text-main truncate">{player.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold">{player.pos} · {player.year}</p>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{player.highlight}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-lg font-black text-primary">{player.ppg}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">PPG</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">sports_basketball</span>
                <div>
                    <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Women's College Basketball</h2>
                    <p className="text-[10px] text-slate-500 font-bold">NCAAW · Top Programs 2025</p>
                </div>
            </div>

            {/* Search + Conference filter */}
            <div className="flex gap-2 flex-wrap">
                <input
                    type="text"
                    placeholder="Search programs..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[160px] px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-text-main placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <div className="flex gap-1 flex-wrap">
                    {conferences.map(conf => (
                        <button
                            key={conf}
                            onClick={() => setSelectedConference(conf)}
                            className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all border ${selectedConference === conf
                                ? 'bg-primary text-black border-primary'
                                : 'text-slate-400 border-neutral-700 hover:text-text-main hover:border-neutral-500'
                                }`}
                        >
                            {conf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Programs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map(program => (
                    <div
                        key={program.id}
                        onClick={() => setSelectedProgram(program)}
                        className="terminal-panel border border-neutral-700/60 p-4 cursor-pointer hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 group"
                        style={{ background: `linear-gradient(135deg, ${program.primaryColor}18, #0d1117)` }}
                    >
                        <div className="flex items-center gap-3">
                            <img
                                src={getTeamLogoUrl(program.id)}
                                alt={program.name}
                                className="w-11 h-11 object-contain shrink-0 group-hover:scale-110 transition-transform duration-300"
                                onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    {program.rank && (
                                        <span className="text-[9px] font-black text-amber-400 shrink-0">#{program.rank}</span>
                                    )}
                                    <p className="text-xs font-black text-text-main truncate uppercase tracking-wide">{program.name}</p>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold">{program.conference} · {program.record}</p>
                                {/* Star player preview — small ESPN headshot + name */}
                                {program.players[0] && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <PlayerAvatar player={program.players[0]} size="w-5 h-5" />
                                        <p className="text-[9px] text-slate-400 truncate">
                                            {program.players[0].name} · {program.players[0].ppg} PPG
                                        </p>
                                    </div>
                                )}
                            </div>
                            <span className="material-symbols-outlined text-slate-600 group-hover:text-primary text-sm shrink-0 transition-colors">chevron_right</span>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="material-symbols-outlined text-3xl text-slate-700 mb-2">search_off</span>
                    <p className="text-slate-500 text-sm font-bold">No programs match your search</p>
                </div>
            )}
        </div>
    );
};

// Silence unused import warning — getConferenceColor retained for future use
void getConferenceColor;
