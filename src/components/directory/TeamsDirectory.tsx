import React, { useState, useEffect, useCallback } from 'react';
import { SPORT_LOGOS } from '../../data/mockGames';
import { TeamDetails } from './TeamDetails';

// ── ESPN Teams API response types ─────────────────────────────────────────────
interface EspnLogoEntry { href: string; width?: number; height?: number; }
interface EspnTeamEntry {
    id?: string; name?: string; abbreviation?: string;
    displayName?: string; shortDisplayName?: string;
    logos?: EspnLogoEntry[]; color?: string; alternateColor?: string;
    location?: string;
}

const ESPN_TEAM_ENDPOINTS: Record<string, string> = {
    NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=100',
    WNBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams?limit=100',
    NCAAB: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?limit=50&groups=50',
    NCAAW: 'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams?limit=50&groups=50',
    NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams?limit=100',
    MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams?limit=100',
    NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams?limit=100',
};

// ── Soccer Leagues ─────────────────────────────────────────────────────────
// Each entry is { id, name, flag, url }
interface SoccerLeague {
    id: string;
    name: string;
    flag: string;         // emoji flag or region
    country: string;
    logo: string;         // league badge
    url: string;          // ESPN API endpoint
}

const SOCCER_LEAGUES: SoccerLeague[] = [
    {
        id: 'eng.1',
        name: 'Premier League',
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        country: 'England',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams?limit=50',
    },
    {
        id: 'esp.1',
        name: 'La Liga',
        flag: '🇪🇸',
        country: 'Spain',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams?limit=50',
    },
    {
        id: 'ger.1',
        name: 'Bundesliga',
        flag: '🇩🇪',
        country: 'Germany',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/teams?limit=50',
    },
    {
        id: 'ita.1',
        name: 'Serie A',
        flag: '🇮🇹',
        country: 'Italy',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/teams?limit=50',
    },
    {
        id: 'fra.1',
        name: 'Ligue 1',
        flag: '🇫🇷',
        country: 'France',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/teams?limit=50',
    },
    {
        id: 'por.1',
        name: 'Primeira Liga',
        flag: '🇵🇹',
        country: 'Portugal',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/18.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/por.1/teams?limit=50',
    },
    {
        id: 'ned.1',
        name: 'Eredivisie',
        flag: '🇳🇱',
        country: 'Netherlands',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/11.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ned.1/teams?limit=50',
    },
    {
        id: 'usa.1',
        name: 'MLS',
        flag: '🇺🇸',
        country: 'USA',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/19.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/teams?limit=50',
    },
    {
        id: 'mex.1',
        name: 'Liga MX',
        flag: '🇲🇽',
        country: 'Mexico',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/26.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/teams?limit=50',
    },
    {
        id: 'bra.1',
        name: 'Brasileirão',
        flag: '🇧🇷',
        country: 'Brazil',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/6.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/bra.1/teams?limit=50',
    },
    {
        id: 'arg.1',
        name: 'Liga Profesional',
        flag: '🇦🇷',
        country: 'Argentina',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/4.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/teams?limit=50',
    },
    {
        id: 'uefa.champions',
        name: 'UEFA Champions League',
        flag: '🏆',
        country: 'Europe',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/teams?limit=50',
    },
    {
        id: 'fifa.world',
        name: 'FIFA World Cup',
        flag: '🌍',
        country: 'World',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/660.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams?limit=100',
    },
    {
        id: 'sco.1',
        name: 'Scottish Premiership',
        flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
        country: 'Scotland',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/24.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/sco.1/teams?limit=50',
    },
    {
        id: 'tur.1',
        name: 'Süper Lig',
        flag: '🇹🇷',
        country: 'Turkey',
        logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/16.png',
        url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/tur.1/teams?limit=50',
    },
];

interface ESPNTeam {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    logo: string;
    color: string;
    alternateColor: string;
    location: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseESPNTeams(data: Record<string, any>): ESPNTeam[] {
    const sports = data?.sports ?? [];
    if (sports.length > 0) {
        const leagues = sports[0]?.leagues ?? [];
        if (leagues.length > 0) {
            const rawTeams = leagues[0]?.teams ?? [];
            return rawTeams.map((t: { team?: EspnTeamEntry } & EspnTeamEntry) => {
                const team = t.team ?? t;
                const logos: EspnLogoEntry[] = team.logos ?? [];
                const logo = logos[0]?.href ?? logos.find((l: EspnLogoEntry) => l.href)?.href ?? '';
                return {
                    id: team.id ?? '',
                    name: team.name ?? '',
                    abbreviation: team.abbreviation ?? '',
                    displayName: team.displayName ?? team.name ?? '',
                    shortDisplayName: team.shortDisplayName ?? team.name ?? '',
                    logo,
                    color: team.color ?? '',
                    alternateColor: team.alternateColor ?? '',
                    location: team.location ?? '',
                };
            });
        }
    }
    const rawTeams = data?.teams ?? [];
    return rawTeams.map((t: { team?: EspnTeamEntry } & EspnTeamEntry) => {
        const team = t.team ?? t;
        const logos: EspnLogoEntry[] = team.logos ?? [];
        const logo = logos[0]?.href ?? '';
        return {
            id: team.id ?? '',
            name: team.name ?? '',
            abbreviation: team.abbreviation ?? '',
            displayName: team.displayName ?? team.name ?? '',
            shortDisplayName: team.shortDisplayName ?? team.name ?? '',
            logo,
            color: team.color ?? '',
            alternateColor: team.alternateColor ?? '',
            location: team.location ?? '',
        };
    });
}

// ── Sport logos displayed in the header ───────────────────────────────────
const EXTRA_SPORT_LOGOS: Record<string, string> = {
    ...SPORT_LOGOS,
    NBA: 'https://cdn.nba.com/logos/nba/nba-logoman-word-white.svg',
    NFL: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
    MLB: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
    NHL: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
    WNBA: 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
    NCAAB: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/NCAA_logo.svg',
    NCAAW: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/NCAA_logo.svg',
    Soccer: 'https://sports.cbsimg.net/fly/images/icon-logos/soccer.svg',
};

const SPORTS_WITH_ESPN_API = [...Object.keys(ESPN_TEAM_ENDPOINTS), 'Soccer'];

// ── Team Card ─────────────────────────────────────────────────────────────
interface TeamCardProps {
    team: ESPNTeam;
    onClick: () => void;
}
const TeamCard: React.FC<TeamCardProps> = ({ team, onClick }) => (
    <div
        onClick={onClick}
        className="group bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary/30 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
    >
        <div className="w-20 h-20 relative flex items-center justify-center">
            {team.logo ? (
                <img
                    src={team.logo}
                    alt={team.displayName}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-lg"
                    onError={e => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = `https://ui-avatars.com/api/?name=${team.abbreviation}&background=121a12&color=0df20d&bold=true&rounded=true`;
                    }}
                />
            ) : (
                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center group-hover:bg-neutral-700 transition-colors">
                    <span className="text-xl font-black text-slate-500">{team.abbreviation.substring(0, 2)}</span>
                </div>
            )}
        </div>
        <div className="text-center">
            <span className="text-sm font-bold text-text-main text-center leading-tight group-hover:text-white transition-colors block">
                {team.displayName}
            </span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5 block">{team.abbreviation}</span>
        </div>
    </div>
);

// ── Soccer View (multi-league) ────────────────────────────────────────────
interface SoccerViewProps {
    onSelectTeam: (team: { name: string; abbr: string; url?: string }) => void;
    searchQuery: string;
}

const SoccerView: React.FC<SoccerViewProps> = ({ onSelectTeam, searchQuery }) => {
    const [activeLeague, setActiveLeague] = useState<SoccerLeague>(SOCCER_LEAGUES[0]);
    const [teams, setTeams] = useState<ESPNTeam[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLeague = useCallback(async (league: SoccerLeague) => {
        setLoading(true);
        setError(null);
        setTeams([]);
        try {
            const res = await fetch(league.url);
            if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
            const data = await res.json();
            const parsed = parseESPNTeams(data);
            parsed.sort((a, b) => a.displayName.localeCompare(b.displayName));
            setTeams(parsed);
        } catch {
            setError(`Could not load ${league.name} teams from ESPN.`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeague(activeLeague);
    }, [activeLeague, fetchLeague]);

    const filtered = searchQuery.trim()
        ? teams.filter(t =>
            t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.location.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : teams;

    return (
        <div className="flex flex-col gap-6">
            {/* League tabs */}
            <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-2 pb-1 min-w-max">
                    {SOCCER_LEAGUES.map(league => (
                        <button
                            key={league.id}
                            onClick={() => setActiveLeague(league)}
                            className={`flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap border ${activeLeague.id === league.id
                                ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(13,242,13,0.25)]'
                                : 'bg-neutral-900 border-neutral-800 text-text-muted hover:text-text-main hover:border-border-muted'
                                }`}
                        >
                            <img
                                src={league.logo}
                                alt={league.name}
                                className={`w-5 h-5 object-contain ${activeLeague.id === league.id ? 'brightness-0' : ''}`}
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <span>{league.flag} {league.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Active league header */}
            <div className="flex items-center gap-3 border-b border-border-muted pb-4">
                <img
                    src={activeLeague.logo}
                    alt={activeLeague.name}
                    className="w-10 h-10 object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div>
                    <h3 className="text-xl font-black text-text-main uppercase italic tracking-tight">
                        {activeLeague.flag} {activeLeague.name}
                    </h3>
                    <p className="text-text-muted text-xs mt-0.5">
                        {loading ? 'Loading teams…' : `${filtered.length} clubs · ${activeLeague.country}`}
                    </p>
                </div>
                <button
                    onClick={() => fetchLeague(activeLeague)}
                    className="ml-auto text-text-muted hover:text-primary transition-colors"
                    title="Refresh"
                >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <span className="material-symbols-outlined text-lg">wifi_off</span>
                    {error}
                    <button onClick={() => fetchLeague(activeLeague)} className="ml-auto text-xs underline">Retry</button>
                </div>
            )}

            {/* Teams grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center gap-3 animate-pulse">
                            <div className="w-16 h-16 rounded-full bg-neutral-800" />
                            <div className="h-3 bg-neutral-800 rounded w-3/4" />
                            <div className="h-2 bg-neutral-800/50 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filtered.map(team => (
                        <TeamCard
                            key={team.id}
                            team={team}
                            onClick={() => onSelectTeam({ name: team.displayName, abbr: team.abbreviation, url: team.logo })}
                        />
                    ))}
                </div>
            ) : !loading && !error ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">search_off</span>
                    <h3 className="text-text-main font-bold text-lg mb-1">No teams found</h3>
                    <p className="text-text-muted text-sm">Try a different league or clear your search.</p>
                </div>
            ) : null}
        </div>
    );
};

// ── Main TeamsDirectory ───────────────────────────────────────────────────
export const TeamsDirectory: React.FC = () => {
    const [selectedSport, setSelectedSport] = useState<string>(SPORTS_WITH_ESPN_API[0]);
    const [selectedTeam, setSelectedTeam] = useState<{ name: string; abbr: string; url?: string } | null>(null);
    const [teams, setTeams] = useState<ESPNTeam[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTeams = useCallback(async (sport: string) => {
        const url = ESPN_TEAM_ENDPOINTS[sport];
        if (!url) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
            const data = await res.json();
            const parsed = parseESPNTeams(data);
            parsed.sort((a, b) => a.displayName.localeCompare(b.displayName));
            setTeams(parsed);
        } catch {
            setError(`Could not load ${sport} teams from ESPN.`);
            setTeams([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedSport !== 'Soccer') {
            fetchTeams(selectedSport);
        }
        setSearchQuery('');
    }, [selectedSport, fetchTeams]);

    const filteredTeams = searchQuery.trim()
        ? teams.filter(t =>
            t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.location.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : teams;

    if (selectedTeam) {
        return (
            <TeamDetails
                team={selectedTeam}
                sport={selectedSport}
                onBack={() => setSelectedTeam(null)}
            />
        );
    }

    return (
        <div className="w-full flex flex-col items-center bg-background-dark py-4 sm:py-8 px-3 sm:px-6 min-h-screen">
            <div className="max-w-[1536px] w-full flex flex-col gap-4 sm:gap-8">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-border-muted flex items-center justify-center p-2 shadow-[0_0_20px_rgba(13,242,13,0.08)]">
                            <img
                                src={EXTRA_SPORT_LOGOS[selectedSport]}
                                alt={selectedSport}
                                className="w-full h-full object-contain"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black text-text-main uppercase italic tracking-tight">
                                {selectedSport} Teams
                            </h2>
                            <p className="text-text-muted text-sm mt-0.5">
                                {selectedSport === 'Soccer'
                                    ? '15 leagues · PickLabs Live Data'
                                    : loading ? 'Loading teams…' : `${filteredTeams.length} teams · PickLabs Live Data`}
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
                        <input
                            type="text"
                            placeholder="Search teams…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-800 border border-border-muted rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main">
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Sport Selection Tabs ── */}
                <div className="bg-neutral-900 border border-border-muted p-1.5 flex gap-1 overflow-x-auto no-scrollbar rounded-xl">
                    {SPORTS_WITH_ESPN_API.map(sport => (
                        <button
                            key={sport}
                            onClick={() => setSelectedSport(sport)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${selectedSport === sport
                                ? 'bg-primary text-black shadow-[0_0_15px_rgba(13,242,13,0.25)]'
                                : 'text-text-muted hover:text-text-main hover:bg-neutral-800'
                                }`}
                        >
                            {EXTRA_SPORT_LOGOS[sport] && (
                                <img
                                    src={EXTRA_SPORT_LOGOS[sport]}
                                    alt={sport}
                                    className={`w-4 h-4 object-contain ${selectedSport === sport ? 'brightness-0' : 'brightness-200 opacity-60'}`}
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            )}
                            {sport}
                        </button>
                    ))}
                </div>

                {/* ── Soccer multi-league view ── */}
                {selectedSport === 'Soccer' ? (
                    <SoccerView onSelectTeam={setSelectedTeam} searchQuery={searchQuery} />
                ) : (
                    <>
                        {/* ── Error ── */}
                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                <span className="material-symbols-outlined text-lg">wifi_off</span>
                                {error}
                                <button onClick={() => fetchTeams(selectedSport)} className="ml-auto text-xs underline hover:no-underline">Retry</button>
                            </div>
                        )}

                        {/* ── Teams Grid ── */}
                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {Array.from({ length: 30 }).map((_, i) => (
                                    <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center gap-3 animate-pulse">
                                        <div className="w-16 h-16 rounded-full bg-neutral-800" />
                                        <div className="h-3 bg-neutral-800 rounded w-3/4" />
                                        <div className="h-2 bg-neutral-800/50 rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredTeams.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {filteredTeams.map(team => (
                                    <TeamCard
                                        key={team.id}
                                        team={team}
                                        onClick={() => setSelectedTeam({ name: team.displayName, abbr: team.abbreviation, url: team.logo })}
                                    />
                                ))}
                            </div>
                        ) : !loading && !error ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">search_off</span>
                                <h3 className="text-text-main font-bold text-lg mb-1">No teams found</h3>
                                <p className="text-text-muted text-sm">Try a different sport or clear your search.</p>
                            </div>
                        ) : null}
                    </>
                )}

            </div>
        </div>
    );
};
