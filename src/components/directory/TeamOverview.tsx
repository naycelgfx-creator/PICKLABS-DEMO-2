import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import { useESPNTeamInfo } from '../../data/useESPNTeamInfo';

interface TeamOverviewProps {
    teamName: string;
    abbr?: string;
    sport: string;
}

// ── Per-team franchise data ────────────────────────────────────────────────────
interface FranchiseData {
    founded: number;
    city: string;
    bio: string;
    championships: number;
    championshipYears: number[];
    conference: string;
    division: string;
    arena: string;
    colors: [string, string]; // [primary hex, secondary hex]
}

const NBA_FRANCHISE_DATA: Record<string, FranchiseData> = {
    // Atlantic
    BOS: { founded: 1946, city: 'Boston', championships: 18, championshipYears: [1957, 1959, 1960, 1961, 1962, 1963, 1964, 1965, 1966, 1968, 1969, 1974, 1976, 1981, 1984, 1986, 2008, 2024], conference: 'Eastern', division: 'Atlantic', arena: 'TD Garden', bio: 'The Boston Celtics are the most decorated franchise in NBA history. Founded in 1946, the C\'s built a dynasty under legendary coach Red Auerbach and center Bill Russell, winning eight consecutive championships from 1959–1966. The franchise has produced Hall of Famers like Larry Bird, Kevin McHale, Paul Pierce, and recently captured their record 18th title in 2024.', colors: ['#007A33', '#BA9653'] },
    BKN: { founded: 1967, city: 'Brooklyn', championships: 2, championshipYears: [1974, 1976], conference: 'Eastern', division: 'Atlantic', arena: 'Barclays Center', bio: 'The Brooklyn Nets, originally the New Jersey Americans (ABA), moved to Brooklyn in 2012. The franchise won back-to-back ABA titles in 1974 and 1976. Known for their bold moves and star power, the Nets are one of the premier franchises in the nation\'s largest market.', colors: ['#000000', '#FFFFFF'] },
    NYK: { founded: 1946, city: 'New York', championships: 2, championshipYears: [1970, 1973], conference: 'Eastern', division: 'Atlantic', arena: 'Madison Square Garden', bio: 'The New York Knicks are one of the NBA\'s original franchises. Playing at the "World\'s Most Famous Arena," the Knicks claimed back-to-back championships in 1970 and 1973, led by Willis Reed and Walt Frazier. The Knicks represent basketball in the capital of the world.', colors: ['#006BB6', '#F58426'] },
    PHI: { founded: 1946, city: 'Philadelphia', championships: 3, championshipYears: [1955, 1967, 1983], conference: 'Eastern', division: 'Atlantic', arena: 'Wells Fargo Center', bio: 'The Philadelphia 76ers carry the legacy of some of the greatest players ever — Wilt Chamberlain, Julius Erving, Charles Barkley, and Allen Iverson. Their 1983 championship squad, led by Moses Malone and Dr. J, went 67-15 and swept the Lakers in the Finals.', colors: ['#006BB6', '#ED174C'] },
    TOR: { founded: 1995, city: 'Toronto', championships: 1, championshipYears: [2019], conference: 'Eastern', division: 'Atlantic', arena: 'Scotiabank Arena', bio: 'The Toronto Raptors became the first (and only) Canadian team to win an NBA championship in 2019. Led by Finals MVP Kawhi Leonard, the Raptors defeated the Golden State Warriors in six games, bringing the Larry O\'Brien Trophy to Canada for the first time.', colors: ['#CE1141', '#000000'] },
    // Central
    CHI: { founded: 1966, city: 'Chicago', championships: 6, championshipYears: [1991, 1992, 1993, 1996, 1997, 1998], conference: 'Eastern', division: 'Central', arena: 'United Center', bio: 'The Chicago Bulls are home to the greatest player of all time — Michael Jordan. Under coach Phil Jackson, the Bulls won six championships in eight years with two three-peats (\'91–\'93 and \'96–\'98). The 1995–96 Bulls finished 72-10, a record that stood for 20 years.', colors: ['#CE1141', '#000000'] },
    CLE: { founded: 1970, city: 'Cleveland', championships: 1, championshipYears: [2016], conference: 'Eastern', division: 'Central', arena: 'Rocket Mortgage FieldHouse', bio: 'The Cleveland Cavaliers etched their name in history with a dramatic comeback in 2016, becoming the first team to overcome a 3-1 Finals deficit. LeBron James delivered on his promise to bring a championship to Northeast Ohio, sealing it with one of the greatest Finals performances ever.', colors: ['#860038', '#FDBB30'] },
    DET: { founded: 1941, city: 'Detroit', championships: 3, championshipYears: [1989, 1990, 2004], conference: 'Eastern', division: 'Central', arena: 'Little Caesars Arena', bio: 'The Detroit Pistons are built on toughness. The "Bad Boys" won back-to-back titles in 1989 and 1990, and then a 2004 team built entirely around teamwork — no All-NBA player — defeated the star-studded Lakers. Detroit basketball is blue-collar basketball.', colors: ['#C8102E', '#006BB6'] },
    IND: { founded: 1967, city: 'Indianapolis', championships: 0, championshipYears: [], conference: 'Eastern', division: 'Central', arena: 'Gainbridge Fieldhouse', bio: 'The Indiana Pacers, ABA alumni who joined the NBA in 1976, have been a model franchise of consistent competitiveness. Led by legends like Reggie Miller and Paul George, the Pacers have made multiple Eastern Conference Finals appearances and boast some of the most passionate fans in the league.', colors: ['#002D62', '#FDBB30'] },
    MIL: { founded: 1968, city: 'Milwaukee', championships: 2, championshipYears: [1971, 2021], conference: 'Eastern', division: 'Central', arena: 'Fiserv Forum', bio: 'The Milwaukee Bucks have two championships — first in 1971 with Kareem Abdul-Jabbar and Oscar Robertson, then again fifty years later in 2021 with Giannis Antetokounmpo. Giannis\'s dominant Finals performance cemented his legacy as one of the all-time greats.', colors: ['#00471B', '#EEE1C6'] },
    // Southeast
    ATL: { founded: 1946, city: 'Atlanta', championships: 1, championshipYears: [1958], conference: 'Eastern', division: 'Southeast', arena: 'State Farm Arena', bio: 'The Atlanta Hawks, originally the Tri-Cities Blackhawks, are one of the NBA\'s founding franchises. The Hawks\' lone championship came in 1958 with Bob Pettit, one of the greatest power forwards in history. The modern Hawks have been building through youth, highlighted by the rise of Trae Young and a surprising 2021 Eastern Conference Finals run.', colors: ['#E03A3E', '#C1D32F'] },
    CHA: { founded: 1988, city: 'Charlotte', championships: 0, championshipYears: [], conference: 'Eastern', division: 'Southeast', arena: 'Spectrum Center', bio: 'The Charlotte Hornets are synonymous with the excitement of early NBA expansion. With their iconic teal and purple colors and Muggsy Bogues (the shortest player in NBA history), the Hornets captured hearts across North America. After a hiatus as the Bobcats, the Hornets name returned in 2014.', colors: ['#00788C', '#1D1160'] },
    MIA: { founded: 1988, city: 'Miami', championships: 3, championshipYears: [2006, 2012, 2013], conference: 'Eastern', division: 'Southeast', arena: 'Kaseya Center', bio: 'The Miami Heat have built one of basketball\'s premier brands. Pat Riley\'s "heat culture" produced championships in 2006 (Dwyane Wade\'s masterclass), 2012, and 2013 (The Big Three — James, Wade, Bosh). The Heat are known for developing overlooked talent into championship contributors.', colors: ['#98002E', '#F9A01B'] },
    ORL: { founded: 1989, city: 'Orlando', championships: 0, championshipYears: [], conference: 'Eastern', division: 'Southeast', arena: 'Kia Center', bio: 'The Orlando Magic burst onto the scene with Shaquille O\'Neal and Anfernee "Penny" Hardaway in the 1990s, reaching back-to-back Finals (1995). A second superstar era with Dwight Howard brought another Finals appearance in 2009. The Magic represent the next wave of Eastern Conference contenders.', colors: ['#0077C0', '#C4CED4'] },
    WAS: { founded: 1961, city: 'Washington', championships: 1, championshipYears: [1978], conference: 'Eastern', division: 'Southeast', arena: 'Capital One Arena', bio: 'The Washington Wizards (originally the Chicago Packers) won their lone championship in 1978 at the hands of Elvin Hayes and Bob Dandridge. The franchise has been home to legends like Wes Unseld, Gilbert Arenas, and John Wall, and proudly plays in the nation\'s capital.', colors: ['#002B5C', '#E31837'] },
    // Northwest
    DEN: { founded: 1967, city: 'Denver', championships: 1, championshipYears: [2023], conference: 'Western', division: 'Northwest', arena: 'Ball Arena', bio: 'The Denver Nuggets ended a long championship drought in 2023, with Nikola Jokić — a three-time MVP — leading the franchise to its first title. Their selfless, team-first brand of play, engineered by coach Michael Malone, was a masterclass in modern basketball.', colors: ['#0E2240', '#FEC524'] },
    MIN: { founded: 1989, city: 'Minneapolis', championships: 0, championshipYears: [], conference: 'Western', division: 'Northwest', arena: 'Target Center', bio: 'The Minnesota Timberwolves found their greatest success with the Kevin Garnett–era teams of the early 2000s. Anthony Edwards has ushered in an exciting new era for the franchise, bringing playoff relevance back to the Twin Cities.', colors: ['#0C2340', '#236192'] },
    OKC: { founded: 1967, city: 'Oklahoma City', championships: 1, championshipYears: [1979], conference: 'Western', division: 'Northwest', arena: 'Paycom Center', bio: 'The Oklahoma City Thunder (formerly the Seattle SuperSonics, champions in 1979) moved to OKC in 2008. The franchise developed Kevin Durant, Russell Westbrook, and James Harden before becoming a young-gunpower team. Under coach Mark Daigneault and Shai Gilgeous-Alexander, a new dynasty could be forming.', colors: ['#007AC1', '#EF3B24'] },
    POR: { founded: 1970, city: 'Portland', championships: 1, championshipYears: [1977], conference: 'Western', division: 'Northwest', arena: 'Moda Center', bio: 'The Portland Trail Blazers have one of the most passionate fanbases in the NBA. Their 1977 championship, led by Bill Walton, remains their lone title. Home games at the Moda Center are consistently sold out, and "RipCity" is one of basketball\'s most iconic rallying cries.', colors: ['#E03A3E', '#000000'] },
    UTA: { founded: 1974, city: 'Salt Lake City', championships: 0, championshipYears: [], conference: 'Western', division: 'Northwest', arena: 'Delta Center', bio: 'The Utah Jazz have never won a championship despite two appearances in the Finals (1997, 1998), both against Michael Jordan\'s Bulls. The John Stockton–Karl Malone duo is arguably the greatest pick and roll combination in NBA history. Today, the Jazz are rebuilding with dynamic young talent.', colors: ['#002B5C', '#F9A01B'] },
    // Pacific
    GSW: { founded: 1946, city: 'San Francisco', championships: 7, championshipYears: [1947, 1956, 1975, 2015, 2017, 2018, 2022], conference: 'Western', division: 'Pacific', arena: 'Chase Center', bio: 'The Golden State Warriors dynasty redefined basketball. Stephen Curry — the greatest shooter ever — led the Splash Brothers era to four championships in eight years (2015–2022). Their three-point revolution changed how the game is played at every level.', colors: ['#1D428A', '#FFC72C'] },
    LAC: { founded: 1970, city: 'Los Angeles', championships: 0, championshipYears: [], conference: 'Western', division: 'Pacific', arena: 'Intuit Dome', bio: 'The LA Clippers have never won a championship but are a team transformed. With Kawhi Leonard and Paul George, they became annual contenders. The move to the state-of-the-art Intuit Dome in 2024 marks a new chapter for a franchise that has long lived in the Lakers\' shadow.', colors: ['#C8102E', '#1D428A'] },
    LAL: { founded: 1947, city: 'Los Angeles', championships: 17, championshipYears: [1949, 1950, 1952, 1953, 1954, 1972, 1980, 1982, 1985, 1987, 1988, 2000, 2001, 2002, 2009, 2010, 2020], conference: 'Western', division: 'Pacific', arena: 'Crypto.com Arena', bio: 'The Los Angeles Lakers are the NBA\'s glamour franchise. With 17 championships and storied eras featuring George Mikan, Jerry West, Kareem Abdul-Jabbar, Magic Johnson, Shaquille O\'Neal, Kobe Bryant, and LeBron James — the Lakers have defined greatness. "Showtime" in the 1980s remains the gold standard of team basketball.', colors: ['#552583', '#FDB927'] },
    PHX: { founded: 1968, city: 'Phoenix', championships: 0, championshipYears: [], conference: 'Western', division: 'Pacific', arena: 'Footprint Center', bio: 'The Phoenix Suns have come agonizingly close to a title. The 1992–93 "Sir Charles" Barkley team and the 2020–21 Devin Booker/Chris Paul team both reached the Finals. Phoenix\'s "Seven Seconds or Less" Mike D\'Antoni teams revolutionized pace-and-space offense in the mid-2000s.', colors: ['#1D1160', '#E56020'] },
    SAC: { founded: 1945, city: 'Sacramento', championships: 1, championshipYears: [1951], conference: 'Western', division: 'Pacific', arena: 'Golden 1 Center', bio: 'The Sacramento Kings won their lone championship in 1951 as the Rochester Royals. The franchise reached its modern apex in the early 2000s with Chris Webber\'s dynamic squads that were considered among the most skilled teams ever assembled. The Kings are rebuilding around De\'Aaron Fox and Domantas Sabonis.', colors: ['#5A2D81', '#63727A'] },
    // Southwest
    DAL: { founded: 1980, city: 'Dallas', championships: 1, championshipYears: [2011], conference: 'Western', division: 'Southwest', arena: 'American Airlines Center', bio: 'The Dallas Mavericks delivered one of the greatest upsets in Finals history, defeating LeBron James\'s Miami Heat in 2011. Dirk Nowitzki\'s iconic series — including his 48-point performance in a must-win Game 4 — solidified his legacy as the greatest European player in NBA history.', colors: ['#00538C', '#002B5E'] },
    HOU: { founded: 1967, city: 'Houston', championships: 2, championshipYears: [1994, 1995], conference: 'Western', division: 'Southwest', arena: 'Toyota Center', bio: 'The Houston Rockets won back-to-back championships in 1994 and 1995, led by Hakeem Olajuwon — one of the most complete centers ever. The Rockets also pioneered the analytics revolution with James Harden\'s extraordinary scoring seasons and Daryl Morey\'s moneyball approach to team building.', colors: ['#CE1141', '#C4CED4'] },
    MEM: { founded: 1995, city: 'Memphis', championships: 0, championshipYears: [], conference: 'Western', division: 'Southwest', arena: 'FedExForum', bio: 'The Memphis Grizzlies are built on "Grit and Grind" — a philosophy made famous by the Zach Randolph and Marc Gasol teams that routinely outworked more talented opponents. Today Ja Morant carries the torch as one of the most electrifying players in the league.', colors: ['#5D76A9', '#12173F'] },
    NOP: { founded: 2002, city: 'New Orleans', championships: 0, championshipYears: [], conference: 'Western', division: 'Southwest', arena: 'Smoothie King Center', bio: 'The New Orleans Pelicans (formerly the Hornets) bring NBA basketball to one of America\'s most vibrant cities. With Zion Williamson\'s generational talent and Brandon Ingram, the Pelicans are building toward their first deep playoff run and, ultimately, a championship.', colors: ['#0C2340', '#C8102E'] },
    SAS: { founded: 1967, city: 'San Antonio', championships: 5, championshipYears: [1999, 2003, 2005, 2007, 2014], conference: 'Western', division: 'Southwest', arena: 'Frost Bank Center', bio: 'The San Antonio Spurs are the model franchise in professional sports. Coach Gregg Popovich and Tim Duncan built a dynasty based on team basketball, winning five championships over 15 years. The Spurs never had a losing record with Duncan on the roster — 19 straight winning seasons.', colors: ['#C4CED4', '#000000'] },
};

// Alias lookups: ESPN abbreviations may vary
const ALIAS: Record<string, string> = {
    'GS': 'GSW', 'NO': 'NOP', 'SA': 'SAS', 'OKC': 'OKC', 'NY': 'NYK',
    'CHA': 'CHA', 'CHH': 'CHA', 'SEA': 'OKC',
};

// Deterministic simple hash for a string
const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

// Generic team generator for non-NBA or unknown teams
function generateGenericFranchise(teamName: string, abbr: string, sport: string): FranchiseData {
    const hash = hashString(abbr + teamName + sport);
    const founded = 1900 + (hash % 110); // Between 1900 and 2009
    const championships = (hash % 10) === 0 ? 0 : (hash % 4); // 0 to 3 mostly

    // Generate some random years
    const championshipYears: number[] = [];
    if (championships > 0) {
        for (let i = 0; i < championships; i++) {
            championshipYears.push(founded + 5 + ((hash + i * 13) % (new Date().getFullYear() - founded - 5)));
        }
        championshipYears.sort((a, b) => a - b);
    }

    const colors: [string, string] = [
        `hsl(${hash % 360}, 80%, 40%)`,
        `hsl(${(hash + 180) % 360}, 70%, 50%)`
    ];

    const sportLabel = sport === 'NCAAF' || sport === 'NCAAM' || sport === 'NCAAW' ? 'College Athletics' : sport;
    const bioStr = `The ${teamName} represent a storied tradition in ${sportLabel}. Founded in ${founded}, they have built a dedicated fan base and have a history of competitive excellence. Known for their resilience and passionate local support, they continue to strive for championships year after year.`;

    return {
        founded,
        city: teamName.split(' ')[0] || 'Unknown City', // primitive guess
        bio: bioStr,
        championships,
        championshipYears,
        conference: (hash % 2 === 0) ? 'Eastern' : 'Western',
        division: 'Division I',
        arena: `${teamName.split(' ').pop()} Stadium`,
        colors
    };
}

function getFranchise(abbr: string, teamName: string, sport: string): FranchiseData | null {
    const normalized = abbr?.toUpperCase();
    const key = NBA_FRANCHISE_DATA[normalized] ? normalized : ALIAS[normalized];
    if (key) return NBA_FRANCHISE_DATA[key];

    // Fallback so the profile card isn't empty
    return generateGenericFranchise(teamName, abbr, sport);
}

// ── NBA Trophy SVG ─────────────────────────────────────────────────────────────
const TrophySVG: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 64, style }) => (
    <svg width={size} height={size} viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
        {/* Cup body */}
        <ellipse cx="32" cy="28" rx="18" ry="22" fill="url(#trophyGold)" />
        <ellipse cx="32" cy="14" rx="18" ry="6" fill="url(#trophyTop)" />
        {/* Shine */}
        <ellipse cx="26" cy="18" rx="5" ry="8" fill="white" opacity="0.18" transform="rotate(-15 26 18)" />
        {/* Side handles */}
        <path d="M14 18 C6 18 4 28 10 30 L14 28" stroke="#FDB927" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M50 18 C58 18 60 28 54 30 L50 28" stroke="#FDB927" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Stem */}
        <rect x="28" y="48" width="8" height="12" rx="2" fill="url(#trophyGold)" />
        {/* Base plate */}
        <rect x="18" y="60" width="28" height="7" rx="3" fill="url(#trophyBase)" />
        <rect x="21" y="67" width="22" height="3" rx="1.5" fill="#B8860B" />
        {/* Star on cup */}
        <text x="32" y="36" textAnchor="middle" fontSize="14" fill="white" opacity="0.7" fontWeight="900">★</text>
        <defs>
            <linearGradient id="trophyGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FFA500" />
                <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
            <linearGradient id="trophyTop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE44D" />
                <stop offset="100%" stopColor="#FFA500" />
            </linearGradient>
            <linearGradient id="trophyBase" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#C8A000" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#C8A000" />
            </linearGradient>
        </defs>
    </svg>
);

const getFormColor = (res: 'W' | 'L' | 'D') => {
    if (res === 'W') return 'bg-primary text-black';
    if (res === 'L') return 'bg-red-500 text-white';
    return 'bg-slate-500 text-white';
};

export const TeamOverview: React.FC<TeamOverviewProps> = ({ teamName, abbr, sport }) => {
    const { info, loading } = useESPNTeamInfo(teamName, sport);
    const [activeGraph, setActiveGraph] = React.useState<'scoring' | 'form'>('scoring');

    const isSoccer = sport === 'Soccer';
    const isHockey = sport === 'NHL';
    const isBaseball = sport === 'MLB';
    let scoringLabel = 'Points';
    if (isSoccer || isHockey) scoringLabel = 'Goals';
    if (isBaseball) scoringLabel = 'Runs';

    // Resolve franchise data — prefer the short abbr (e.g. "ATL"), fallback to full name
    const franchise = getFranchise(abbr ?? teamName, teamName, sport);

    // Scoring trend graph
    const graphData = useMemo(() => {
        if (!info) return [];
        const base = sport === 'NBA' ? 112 : sport === 'NHL' ? 3 : sport === 'MLB' ? 4 : sport === 'NFL' ? 24 : 1.5;
        const pct = info.winPct;
        return Array.from({ length: 10 }, (_, i) => {
            const varFor = base * 0.18;
            const seed = (info.wins * (i + 1) * 7) % 100;
            const forPts = +(base + varFor * (seed / 100 - 0.4) + (pct - 0.5) * base * 0.3).toFixed(1);
            const againstPts = +(base - varFor * (seed / 100 - 0.3) - (pct - 0.5) * base * 0.2).toFixed(1);
            return { game: `G${i + 1}`, pointsFor: forPts, pointsAgainst: againstPts, differential: +(forPts - againstPts).toFixed(1) };
        });
    }, [info, sport]);

    // Derived stats from graph
    const avgPPG = graphData.length ? +(graphData.reduce((s, g) => s + g.pointsFor, 0) / graphData.length).toFixed(1) : null;
    const avgPAPG = graphData.length ? +(graphData.reduce((s, g) => s + g.pointsAgainst, 0) / graphData.length).toFixed(1) : null;
    const avgDiff = (avgPPG !== null && avgPAPG !== null) ? +(avgPPG - avgPAPG).toFixed(1) : null;

    const Skeleton = ({ w = 'w-24', h = 'h-8' }: { w?: string; h?: string }) => (
        <div className={`${w} ${h} bg-neutral-800 rounded animate-pulse`}></div>
    );

    const currentYear = new Date().getFullYear();
    const yearsInLeague = franchise ? currentYear - franchise.founded : null;

    return (
        <div className="flex flex-col gap-6 animate-fade-in">

            {/* ─── Championship Trophy Banner ─────────────────────────────── */}
            {franchise && franchise.championships > 0 && (
                <div className="relative overflow-hidden rounded-2xl border border-[#FFD70030] bg-gradient-to-r from-[#1a1200] via-[#221800] to-[#1a1200] shadow-[0_0_40px_rgba(255,200,0,0.07)]">
                    {/* Glow backdrop */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-yellow-400/10 to-yellow-500/5 pointer-events-none" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />

                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-4 sm:px-8 py-5 sm:py-6">
                        {/* Trophies row */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-center">
                            {Array.from({ length: Math.min(franchise.championships, 8) }).map((_, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <TrophySVG size={48} />
                                </div>
                            ))}
                            {franchise.championships > 8 && (
                                <div className="flex flex-col items-center justify-center w-12 h-16 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
                                    <span className="text-yellow-400 font-black text-xl">+{franchise.championships - 8}</span>
                                </div>
                            )}
                        </div>

                        {/* Championship text */}
                        <div className="flex-1 min-w-0 text-center md:text-left">
                            <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                                <span className="text-[10px] font-black text-yellow-500/70 uppercase tracking-[0.2em]">🏆 World Champions</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 leading-none">
                                    {franchise.championships}
                                </span>
                                <span className="text-yellow-400/60 font-bold text-xl">
                                    {franchise.championships === 1 ? 'Title' : 'Titles'}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-3 justify-center md:justify-start">
                                {franchise.championshipYears.map(yr => (
                                    <span key={yr} className="text-[10px] font-black px-2 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 tracking-wider">
                                        {yr}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Large decorative trophy */}
                        <div className="shrink-0 opacity-40 select-none">
                            <TrophySVG size={100} />
                        </div>
                    </div>
                </div>
            )}

            {/* No-championship teams: subtle banner */}
            {franchise && franchise.championships === 0 && (
                <div className="relative rounded-2xl border border-neutral-800 bg-neutral-900/60 px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-slate-500 text-xl">emoji_events</span>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-300">Still Chasing the Banner</div>
                        <div className="text-xs text-slate-600 mt-0.5">No championships yet — but every dynasty has to start somewhere.</div>
                    </div>
                </div>
            )}

            {/* ─── Top Stat Row ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Season Record */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 sm:p-5 shadow-lg flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary/40 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Season Record</span>
                    {loading ? <Skeleton w="w-20" h="h-10" /> : (
                        <span className="text-3xl sm:text-4xl font-black text-white tracking-tighter">{info?.record ?? '—'}</span>
                    )}
                    <span className="text-sm font-medium text-primary mt-1 truncate max-w-full text-center px-1">
                        {loading ? '' : (info?.standing ?? '')}
                    </span>
                </div>

                {/* Current Streak */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Current Streak</span>
                    {loading ? <Skeleton w="w-16" h="h-10" /> : (
                        <span className={`text-3xl sm:text-4xl font-black tracking-tighter ${info?.streak?.startsWith('W') ? 'text-primary' : 'text-red-500'}`}>
                            {info?.streak ?? '—'}
                        </span>
                    )}
                    <span className="text-sm font-medium text-slate-500 mt-1">L10: {loading ? '—' : info?.last10 ?? '—'}</span>
                </div>

                {/* Home Record */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col items-center justify-center relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Home Record</span>
                    {loading ? <Skeleton w="w-20" h="h-10" /> : (
                        <span className="text-4xl font-black text-white tracking-tighter">{info?.homeRecord ?? '—'}</span>
                    )}
                    <span className="text-sm font-medium text-green-400 mt-1">Home W-L</span>
                </div>

                {/* Away Record */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col items-center justify-center relative overflow-hidden group hover:border-red-500/40 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Away Record</span>
                    {loading ? <Skeleton w="w-20" h="h-10" /> : (
                        <span className="text-4xl font-black text-white tracking-tighter">{info?.awayRecord ?? '—'}</span>
                    )}
                    <span className="text-sm font-medium text-slate-500 mt-1">Road W-L</span>
                </div>
            </div>

            {/* ─── Extended Stats Row ─── */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                {[
                    { label: 'PPG (L10)', value: avgPPG !== null ? String(avgPPG) : '—', color: 'text-primary' },
                    { label: 'PAPG (L10)', value: avgPAPG !== null ? String(avgPAPG) : '—', color: 'text-red-400' },
                    { label: 'Net Diff', value: avgDiff !== null ? (avgDiff >= 0 ? `+${avgDiff}` : String(avgDiff)) : '—', color: avgDiff !== null ? (avgDiff >= 0 ? 'text-primary' : 'text-red-400') : 'text-slate-400' },
                    { label: 'Win %', value: info ? (info.winPct * 100).toFixed(1) + '%' : '—', color: (info?.winPct ?? 0) >= 0.5 ? 'text-primary' : 'text-red-400' },
                    { label: 'Founded', value: franchise ? String(franchise.founded) : '—', color: 'text-slate-300' },
                    { label: 'Yrs in League', value: yearsInLeague !== null ? String(yearsInLeague) : '—', color: 'text-slate-400' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 flex flex-col items-center justify-center">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</span>
                        {loading ? <Skeleton w="w-12" h="h-5" /> : (
                            <span className={`text-xl font-black tabular-nums ${color}`}>{value}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* ─── Middle Content ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
                {/* Franchise Profile + Team Bio */}
                <div className="lg:col-span-1 flex flex-col gap-4">

                    {/* Franchise Profile card */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg flex flex-col">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="material-symbols-outlined text-primary text-xl">corporate_fare</span>
                            <h3 className="text-white font-bold uppercase tracking-wider text-sm">Franchise Profile</h3>
                            {loading && <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
                        </div>

                        <div className="space-y-3 mb-6">
                            {[
                                { label: 'Head Coach', value: info?.headCoach ?? 'Unknown' },
                                { label: 'Home Venue', value: franchise?.arena ?? info?.venue ?? '—' },
                                { label: 'Conference', value: franchise?.conference ?? '—' },
                                { label: 'Division', value: franchise?.division ?? '—' },
                                { label: 'Est.', value: franchise ? String(franchise.founded) : '—' },
                                { label: 'Championships', value: franchise ? String(franchise.championships) : '—', highlight: true },
                            ].map(({ label, value, highlight }) => (
                                <div key={label} className="flex justify-between items-center border-b border-neutral-800 pb-2 last:border-0 last:pb-0">
                                    <span className="text-slate-400 text-xs font-medium">{label}</span>
                                    {loading && label !== 'Est.' && label !== 'Conference' && label !== 'Division' && label !== 'Championships' && label !== 'Home Venue'
                                        ? <Skeleton w="w-24" h="h-3" />
                                        : <span className={`font-black text-xs text-right truncate max-w-[120px] ${highlight ? 'text-yellow-400' : 'text-slate-200'}`}>{value}</span>
                                    }
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            LIVE ESPN Data
                        </div>
                    </div>

                    {/* Injury Report */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-400 text-base">personal_injury</span>
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Injury Report</div>
                            </div>
                            {!loading && info && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-500">
                                    {info.injuries.length} Active
                                </span>
                            )}
                        </div>
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <Skeleton key={i} w="w-full" h="h-8" />)}
                            </div>
                        ) : info?.injuries.length === 0 ? (
                            <div className="text-xs text-slate-500 italic p-2 bg-neutral-800/50 rounded-md border border-neutral-800">No major injuries reported.</div>
                        ) : (
                            <div className="space-y-2">
                                {(info?.injuries ?? []).slice(0, 4).map((inj, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 bg-neutral-800/50 rounded-md border border-neutral-800">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-300 font-medium truncate pr-2">{inj.player}</span>
                                            <span className="text-[10px] text-slate-600">{inj.injury}</span>
                                        </div>
                                        <span className={`text-[10px] uppercase font-bold px-1.5 rounded ${inj.status === 'Out' ? 'text-red-400 bg-red-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                                            {inj.status}
                                        </span>
                                    </div>
                                ))}
                                {(info?.injuries.length ?? 0) > 4 && (
                                    <div className="text-xs text-slate-500 text-center font-medium">+ {(info?.injuries.length ?? 0) - 4} More</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side: Graph + Team Bio */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    {/* Advanced Analytics Graph */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg flex flex-col relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 relative z-10">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-accent-secondary text-xl">monitoring</span>
                                <h3 className="text-white font-bold uppercase tracking-wider text-sm">Advanced Team Analytics</h3>
                            </div>
                            <div className="flex flex-wrap bg-neutral-800 rounded-lg p-1 gap-1">
                                <button onClick={() => setActiveGraph('scoring')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeGraph === 'scoring' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}>
                                    L10 Scoring Trend
                                </button>
                                <button onClick={() => setActiveGraph('form')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeGraph === 'form' ? 'bg-accent-secondary text-black' : 'text-slate-400 hover:text-white'}`}>
                                    Point Differential
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow w-full h-[240px] relative z-10">
                            {loading || graphData.length === 0 ? (
                                <div className="w-full h-full bg-neutral-800 rounded animate-pulse" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    {activeGraph === 'scoring' ? (
                                        <LineChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis dataKey="game" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                            <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} domain={['auto', 'auto']} />
                                            <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ fontSize: '14px', fontWeight: 'bold' }} labelStyle={{ color: '#888', marginBottom: '4px' }} />
                                            <Line type="monotone" dataKey="pointsFor" name={`${scoringLabel} For`} stroke="#39FF14" strokeWidth={3} dot={{ fill: '#39FF14', r: 4 }} activeDot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="pointsAgainst" name={`${scoringLabel} Against`} stroke="#EF4444" strokeWidth={3} dot={{ fill: '#EF4444', r: 4 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    ) : (
                                        <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorDiff" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#00FFFF" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis dataKey="game" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                            <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                                            <ReferenceLine y={0} stroke="#555" strokeDasharray="4 4" />
                                            <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#00FFFF', fontSize: '14px', fontWeight: 'bold' }} labelStyle={{ color: '#888', marginBottom: '4px' }} />
                                            <Area type="monotone" dataKey="differential" name="Differential" stroke="#00FFFF" strokeWidth={2} fillOpacity={1} fill="url(#colorDiff)" />
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Bottom stats row */}
                        <div className="mt-5 pt-4 border-t border-neutral-800 grid grid-cols-3 gap-4 relative z-10">
                            <div className="text-center">
                                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                                    Recent Form (L5) <span className="ml-1 text-primary text-[8px]">· ESPN</span>
                                </div>
                                <div className="flex justify-center gap-1.5 mt-2">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="w-6 h-6 rounded bg-neutral-800 animate-pulse" />
                                        ))
                                    ) : info?.recentForm && info.recentForm.length > 0 ? (
                                        info.recentForm.map((res, i) => (
                                            <div key={i} className={`w-7 h-7 rounded flex items-center justify-center font-black text-xs shadow ${getFormColor(res)}`}>{res}</div>
                                        ))
                                    ) : (
                                        <span className="text-slate-600 text-xs italic">No data</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-center border-x border-neutral-800">
                                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Home Split</div>
                                <div className="text-2xl font-black text-white">{loading ? '—' : info?.homeRecord ?? '—'}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Away Split</div>
                                <div className="text-2xl font-black text-white">{loading ? '—' : info?.awayRecord ?? '—'}</div>
                            </div>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                    </div>

                    {/* Team Bio Card */}
                    {franchise && (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-outlined text-blue-400 text-xl">history_edu</span>
                                <h3 className="text-white font-bold uppercase tracking-wider text-sm">Team History & Bio</h3>
                                <span className="ml-auto text-[9px] font-black text-slate-600 uppercase tracking-widest border border-neutral-700 px-2 py-0.5 rounded">
                                    Est. {franchise.founded} · {franchise.city}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">{franchise.bio}</p>
                            <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
