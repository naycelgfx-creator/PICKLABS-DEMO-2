export interface Team {
    id: string;
    name: string;
    logo: string;
    url?: string;
    record: string;
    color: string;
    winProb: number;
    recentForm: ('W' | 'L')[];
    score?: number;
}

export interface Game {
    id: string;
    sport: string;
    sportLogo: string;
    status: 'LIVE' | 'UPCOMING' | 'FINAL';
    timeLabel: string;
    matchupId: string;
    homeTeam: Team;
    awayTeam: Team;
    odds: {
        moneyline: string;
        spread: string;
        overUnder: { value: string; pick: 'Over' | 'Under' };
    };
    streakLabel: string;
    date: string;
    league?: string;
    venue: {
        name: string;
        location: string;
    };
    broadcast: string;
}

export const SPORT_LOGOS: Record<string, string> = {
    NBA: 'https://cdn.nba.com/logos/nba/nba-logoman-word-white.svg',
    NFL: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
    MLB: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
    NHL: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
    Soccer: 'https://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo-500.png',
    UFC: 'https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg',
    NCAAB: 'https://ui-avatars.com/api/?name=NCAA&background=000&color=fff&rounded=true&bold=true',
    WNBA: 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
    NCAAW: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/NCAA_logo.svg'
};

export const REAL_TEAMS: Record<string, { name: string, abbr: string, type?: 'team' | 'player', url?: string, league?: string }[]> = {
    NBA: [
        { name: '76ers', abbr: 'phi', url: 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png' },
        { name: 'Bucks', abbr: 'mil', url: 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png' },
        { name: 'Bulls', abbr: 'chi', url: 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png' },
        { name: 'Cavaliers', abbr: 'cle', url: 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png' },
        { name: 'Celtics', abbr: 'bos', url: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png' },
        { name: 'Clippers', abbr: 'lac', url: 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png' },
        { name: 'Grizzlies', abbr: 'mem', url: 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png' },
        { name: 'Hawks', abbr: 'atl', url: 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png' },
        { name: 'Heat', abbr: 'mia', url: 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png' },
        { name: 'Hornets', abbr: 'cha', url: 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png' },
        { name: 'Jazz', abbr: 'utah', url: 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png' },
        { name: 'Kings', abbr: 'sac', url: 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png' },
        { name: 'Knicks', abbr: 'nyk', url: 'https://a.espncdn.com/i/teamlogos/nba/500/nyk.png' },
        { name: 'Lakers', abbr: 'lal', url: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png' },
        { name: 'Magic', abbr: 'orl', url: 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png' },
        { name: 'Mavericks', abbr: 'dal', url: 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png' },
        { name: 'Nets', abbr: 'bkn', url: 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png' },
        { name: 'Nuggets', abbr: 'den', url: 'https://a.espncdn.com/i/teamlogos/nba/500/den.png' },
        { name: 'Pacers', abbr: 'ind', url: 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png' },
        { name: 'Pelicans', abbr: 'no', url: 'https://a.espncdn.com/i/teamlogos/nba/500/no.png' },
        { name: 'Pistons', abbr: 'det', url: 'https://a.espncdn.com/i/teamlogos/nba/500/det.png' },
        { name: 'Raptors', abbr: 'tor', url: 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png' },
        { name: 'Rockets', abbr: 'hou', url: 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png' },
        { name: 'Spurs', abbr: 'sas', url: 'https://a.espncdn.com/i/teamlogos/nba/500/sas.png' },
        { name: 'Suns', abbr: 'phx', url: 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png' },
        { name: 'Thunder', abbr: 'okc', url: 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png' },
        { name: 'Timberwolves', abbr: 'min', url: 'https://a.espncdn.com/i/teamlogos/nba/500/min.png' },
        { name: 'Trail Blazers', abbr: 'por', url: 'https://a.espncdn.com/i/teamlogos/nba/500/por.png' },
        { name: 'Warriors', abbr: 'gsw', url: 'https://a.espncdn.com/i/teamlogos/nba/500/gsw.png' },
        { name: 'Wizards', abbr: 'was', url: 'https://a.espncdn.com/i/teamlogos/nba/500/was.png' }
    ],
    NFL: [
        { name: '49ers', abbr: 'sf', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' },
        { name: 'Bears', abbr: 'chi', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' },
        { name: 'Bengals', abbr: 'cin', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png' },
        { name: 'Bills', abbr: 'buf', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png' },
        { name: 'Broncos', abbr: 'den', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png' },
        { name: 'Browns', abbr: 'cle', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png' },
        { name: 'Buccaneers', abbr: 'tb', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png' },
        { name: 'Cardinals', abbr: 'ari', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png' },
        { name: 'Chargers', abbr: 'lac', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png' },
        { name: 'Chiefs', abbr: 'kc', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
        { name: 'Colts', abbr: 'ind', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png' },
        { name: 'Commanders', abbr: 'was', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/was.png' },
        { name: 'Cowboys', abbr: 'dal', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
        { name: 'Dolphins', abbr: 'mia', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png' },
        { name: 'Eagles', abbr: 'phi', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' },
        { name: 'Falcons', abbr: 'atl', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png' },
        { name: 'Giants', abbr: 'nyg', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png' },
        { name: 'Jaguars', abbr: 'jax', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png' },
        { name: 'Jets', abbr: 'nyj', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png' },
        { name: 'Lions', abbr: 'det', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png' },
        { name: 'Packers', abbr: 'gb', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
        { name: 'Panthers', abbr: 'car', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png' },
        { name: 'Patriots', abbr: 'ne', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' },
        { name: 'Raiders', abbr: 'lv', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png' },
        { name: 'Rams', abbr: 'lar', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png' },
        { name: 'Ravens', abbr: 'bal', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png' },
        { name: 'Saints', abbr: 'no', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png' },
        { name: 'Seahawks', abbr: 'sea', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png' },
        { name: 'Steelers', abbr: 'pit', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png' },
        { name: 'Texans', abbr: 'hou', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png' },
        { name: 'Titans', abbr: 'ten', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png' },
        { name: 'Vikings', abbr: 'min', url: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png' },
    ],
    MLB: [
        { name: 'Angels', abbr: 'laa', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/laa.png' },
        { name: 'Astros', abbr: 'hou', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/hou.png' },
        { name: 'Athletics', abbr: 'oak', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/oak.png' },
        { name: 'Blue Jays', abbr: 'tor', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/tor.png' },
        { name: 'Braves', abbr: 'atl', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/atl.png' },
        { name: 'Brewers', abbr: 'mil', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/mil.png' },
        { name: 'Cardinals', abbr: 'stl', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/stl.png' },
        { name: 'Cubs', abbr: 'chc', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png' },
        { name: 'Diamondbacks', abbr: 'ari', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/ari.png' },
        { name: 'Dodgers', abbr: 'la', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/la.png' },
        { name: 'Giants', abbr: 'sf', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/sf.png' },
        { name: 'Guardians', abbr: 'cle', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/cle.png' },
        { name: 'Mariners', abbr: 'sea', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/sea.png' },
        { name: 'Marlins', abbr: 'mia', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/mia.png' },
        { name: 'Mets', abbr: 'nym', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/nym.png' },
        { name: 'Nationals', abbr: 'wsh', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/wsh.png' },
        { name: 'Orioles', abbr: 'bal', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/bal.png' },
        { name: 'Padres', abbr: 'sd', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/sd.png' },
        { name: 'Phillies', abbr: 'phi', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/phi.png' },
        { name: 'Pirates', abbr: 'pit', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/pit.png' },
        { name: 'Rangers', abbr: 'tex', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/tex.png' },
        { name: 'Rays', abbr: 'tb', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/tb.png' },
        { name: 'Red Sox', abbr: 'bos', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/bos.png' },
        { name: 'Reds', abbr: 'cin', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/cin.png' },
        { name: 'Rockies', abbr: 'col', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/col.png' },
        { name: 'Royals', abbr: 'kc', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/kc.png' },
        { name: 'Tigers', abbr: 'det', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/det.png' },
        { name: 'Twins', abbr: 'min', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/min.png' },
        { name: 'White Sox', abbr: 'cws', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/cws.png' },
        { name: 'Yankees', abbr: 'nyy', url: 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png' }
    ],
    NHL: [
        { name: 'Avalanche', abbr: 'col', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/col.png' },
        { name: 'Blackhawks', abbr: 'chi', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/chi.png' },
        { name: 'Blue Jackets', abbr: 'cbj', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/cbj.png' },
        { name: 'Blues', abbr: 'stl', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/stl.png' },
        { name: 'Bruins', abbr: 'bos', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/bos.png' },
        { name: 'Canadiens', abbr: 'mtl', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/mtl.png' },
        { name: 'Canucks', abbr: 'van', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/van.png' },
        { name: 'Capitals', abbr: 'wsh', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/wsh.png' },
        { name: 'Coyotes', abbr: 'ari', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/ari.png' },
        { name: 'Devils', abbr: 'nj', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/nj.png' },
        { name: 'Ducks', abbr: 'ana', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/ana.png' },
        { name: 'Flames', abbr: 'cgy', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/cgy.png' },
        { name: 'Flyers', abbr: 'phi', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/phi.png' },
        { name: 'Golden Knights', abbr: 'vgk', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/vgk.png' },
        { name: 'Hurricanes', abbr: 'car', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/car.png' },
        { name: 'Islanders', abbr: 'nyi', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/nyi.png' },
        { name: 'Jets', abbr: 'wpg', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/wpg.png' },
        { name: 'Kings', abbr: 'la', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/la.png' },
        { name: 'Kraken', abbr: 'sea', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/sea.png' },
        { name: 'Lightning', abbr: 'tb', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/tb.png' },
        { name: 'Maple Leafs', abbr: 'tor', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/tor.png' },
        { name: 'Oilers', abbr: 'edm', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/edm.png' },
        { name: 'Panthers', abbr: 'fla', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/fla.png' },
        { name: 'Penguins', abbr: 'pit', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/pit.png' },
        { name: 'Predators', abbr: 'nsh', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/nsh.png' },
        { name: 'Rangers', abbr: 'nyr', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png' },
        { name: 'Red Wings', abbr: 'det', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/det.png' },
        { name: 'Sabres', abbr: 'buf', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/buf.png' },
        { name: 'Senators', abbr: 'ott', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/ott.png' },
        { name: 'Sharks', abbr: 'sj', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/sj.png' },
        { name: 'Stars', abbr: 'dal', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/dal.png' },
        { name: 'Wild', abbr: 'min', url: 'https://a.espncdn.com/i/teamlogos/nhl/500/min.png' }
    ],
    Soccer: [
        { name: 'AC Milan', abbr: 'ACM', league: 'Serie A', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/512px-Logo_of_AC_Milan.svg.png' },
        { name: 'Arsenal', abbr: 'ARS', league: 'Premier League', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/512px-Arsenal_FC.svg.png' },
        { name: 'Aston Villa', abbr: 'AVL', league: 'Premier League', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f9/Aston_Villa_FC_crest_%282016%29.svg/512px-Aston_Villa_FC_crest_%282016%29.svg.png' },
        { name: 'Atletico Madrid', abbr: 'ATM', league: 'La Liga', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_Madrid_2017_logo.svg/512px-Atletico_Madrid_2017_logo.svg.png' },
        { name: 'Barcelona', abbr: 'FCB', league: 'La Liga', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/512px-FC_Barcelona_%28crest%29.svg.png' },
        { name: 'Bayern Munich', abbr: 'MUN', league: 'Bundesliga', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/512px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png' },
        { name: 'Chelsea', abbr: 'CHE', league: 'Premier League', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/512px-Chelsea_FC.svg.png' },
        { name: 'Dortmund', abbr: 'BVB', league: 'Bundesliga', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/512px-Borussia_Dortmund_logo.svg.png' },
        { name: 'Inter Miami', abbr: 'MIA', league: 'MLS', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/Inter_Miami_CF_logo.svg/512px-Inter_Miami_CF_logo.svg.png' },
        { name: 'Inter Milan', abbr: 'INT', league: 'Serie A', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/512px-FC_Internazionale_Milano_2021.svg.png' },
        { name: 'Juventus', abbr: 'JUV', league: 'Serie A', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Juventus_FC_2017_icon_%28black%29.svg/512px-Juventus_FC_2017_icon_%28black%29.svg.png' },
        { name: 'LA Galaxy', abbr: 'LAG', league: 'MLS', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/j/jq/LA_Galaxy_logo_2020.svg/512px-LA_Galaxy_logo_2020.svg.png' },
        { name: 'LAFC', abbr: 'LAFC', league: 'MLS', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/Los_Angeles_Football_Club.svg/512px-Los_Angeles_Football_Club.svg.png' },
        { name: 'Leverkusen', abbr: 'B04', league: 'Bundesliga', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/59/Bayer_04_Leverkusen_logo.svg/512px-Bayer_04_Leverkusen_logo.svg.png' },
        { name: 'Liverpool', abbr: 'LIV', league: 'Premier League', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/512px-Liverpool_FC.svg.png' },
        { name: 'Man City', abbr: 'MCI', league: 'Premier League', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/512px-Manchester_City_FC_badge.svg.png' },
        { name: 'Man United', abbr: 'MUN', league: 'Premier League', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/512px-Manchester_United_FC_crest.svg.png' },
        { name: 'Marseille', abbr: 'OM', league: 'Ligue 1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Olympique_Marseille_logo.svg/512px-Olympique_Marseille_logo.svg.png' },
        { name: 'Napoli', abbr: 'NAP', league: 'Serie A', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/SSC_Napoli_logo.svg/512px-SSC_Napoli_logo.svg.png' },
        { name: 'PSG', abbr: 'PSG', league: 'Ligue 1', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/512px-Paris_Saint-Germain_F.C..svg.png' },
        { name: 'Real Madrid', abbr: 'RMA', league: 'La Liga', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/512px-Real_Madrid_CF.svg.png' },
        { name: 'Tottenham', abbr: 'TOT', league: 'Premier League', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Tottenham_Hotspur.svg/512px-Tottenham_Hotspur.svg.png' },
    ],
    UFC: [
        { name: 'A. Pereira', abbr: 'pereira', type: 'player', url: 'https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/4889269.png&w=350&h=254' },
        { name: 'C. McGregor', abbr: 'conor-mcgregor', type: 'player', url: 'https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/2504169.png&w=350&h=254' },
        { name: 'I. Adesanya', abbr: 'adesanya', type: 'player', url: 'https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/3155850.png&w=350&h=254' },
        { name: 'I. Makhachev', abbr: 'makhachev', type: 'player', url: 'https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/3041933.png&w=350&h=254' },
        { name: 'J. Jones', abbr: 'jon-jones', type: 'player', url: 'https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/2335639.png&w=350&h=254' },
        { name: "S. O'Malley", abbr: 'omalley', type: 'player', url: 'https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/4222625.png&w=350&h=254' }
    ],
    NCAAB: [
        { name: 'Arizona', abbr: 'ariz', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/12.png' },
        { name: 'Auburn', abbr: 'aub', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2.png' },
        { name: 'Baylor', abbr: 'bay', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/239.png' },
        { name: 'Duke', abbr: 'duke', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/150.png' },
        { name: 'Gonzaga', abbr: 'gonz', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2250.png' },
        { name: 'Houston', abbr: 'hou', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/248.png' },
        { name: 'Illinois', abbr: 'ill', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/356.png' },
        { name: 'Iowa State', abbr: 'isu', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/66.png' },
        { name: 'Kansas', abbr: 'ku', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2305.png' },
        { name: 'Kentucky', abbr: 'uk', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/96.png' },
        { name: 'Marquette', abbr: 'marq', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/269.png' },
        { name: 'Michigan State', abbr: 'msu', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/127.png' },
        { name: 'North Carolina', abbr: 'unc', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/153.png' },
        { name: 'Purdue', abbr: 'pur', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2509.png' },
        { name: 'Tennessee', abbr: 'tenn', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png' },
        { name: 'UConn', abbr: 'uconn', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/41.png' },
        { name: 'Villanova', abbr: 'nova', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/222.png' },
        { name: 'Virginia', abbr: 'uva', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/258.png' }
    ],
    WNBA: [
        { name: 'Aces', abbr: 'lv', url: 'https://a.espncdn.com/i/teamlogos/wnba/500/lv.png' },
        { name: 'Dream', abbr: 'atl', url: 'https://a.espncdn.com/i/teamlogos/wnba/500/atl.png' },
        { name: 'Fever', abbr: 'ind', url: 'https://a.espncdn.com/i/teamlogos/wnba/500/ind.png' },
        { name: 'Liberty', abbr: 'ny', url: 'https://a.espncdn.com/i/teamlogos/wnba/500/ny.png' },
        { name: 'Lynx', abbr: 'min', url: 'https://a.espncdn.com/i/teamlogos/wnba/500/min.png' },
        { name: 'Mercury', abbr: 'phx', url: 'https://a.espncdn.com/i/teamlogos/wnba/500/phx.png' },
        { name: 'Mystics', abbr: 'was', url: 'https://a.espncdn.com/i/teamlogos/wnba/500/was.png' },
        { name: 'Sky', abbr: 'chi', url: 'https://a.espncdn.com/i/teamlogos/wnba/500/chi.png' },
        { name: 'Sparks', abbr: 'la', url: 'https://a.espncdn.com/i/teamlogos/wnba/500/la.png' },
        { name: 'Storm', abbr: 'sea', url: 'https://a.espncdn.com/i/teamlogos/wnba/500/sea.png' },
        { name: 'Sun', abbr: 'conn', url: 'https://a.espncdn.com/i/teamlogos/wnba/500/conn.png' },
        { name: 'Wings', abbr: 'dal', url: 'https://a.espncdn.com/i/teamlogos/wnba/500/dal.png' }
    ],
    NCAAW: [
        { name: 'Beavers', abbr: '204', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/204.png' },
        { name: 'Bruins', abbr: '26', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/26.png' },
        { name: 'Buckeyes', abbr: '194', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/194.png' },
        { name: 'Gamecocks', abbr: '2579', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2579.png' },
        { name: 'Hawkeyes', abbr: '2294', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2294.png' },
        { name: 'Huskies', abbr: '41', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/41.png' },
        { name: 'Irish', abbr: '87', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/87.png' },
        { name: 'Longhorns', abbr: '251', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/251.png' },
        { name: 'Stanford', abbr: '24', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/24.png' },
        { name: 'Tigers', abbr: '99', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/99.png' },
        { name: 'Trojans', abbr: '30', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png' },
        { name: 'Wolfpack', abbr: '152', url: 'https://a.espncdn.com/i/teamlogos/ncaa/500/152.png' }
    ]
};

const getLogoUrl = (sport: string, playerTeam: { name: string, abbr: string, type?: string, url?: string }) => {
    if (playerTeam.url) {
        return playerTeam.url; // Use hardcoded image URLs if available
    }

    if (playerTeam.type === 'player') {
        // Fallback for players without specific ESPN URLs mapped
        return `https://ui-avatars.com/api/?name=${playerTeam.abbr}&background=random&color=fff&rounded=true&bold=true`;
    }

    if (sport === 'Soccer') return `https://a.espncdn.com/i/teamlogos/soccer/500/${playerTeam.abbr}.png`;
    if (sport === 'NBA') return `https://a.espncdn.com/i/teamlogos/nba/500/${playerTeam.abbr}.png`;
    if (sport === 'WNBA') return `https://a.espncdn.com/i/teamlogos/wnba/500/${playerTeam.abbr}.png`;
    if (sport === 'NCAAW') return `https://a.espncdn.com/i/teamlogos/ncaa/500/${playerTeam.abbr}.png`;
    if (sport === 'NFL') return `https://a.espncdn.com/i/teamlogos/nfl/500/${playerTeam.abbr}.png`;
    if (sport === 'MLB') return `https://a.espncdn.com/i/teamlogos/mlb/500/${playerTeam.abbr}.png`;
    if (sport === 'NHL') return `https://a.espncdn.com/i/teamlogos/nhl/500/${playerTeam.abbr}.png`;

    // Generic fallback for anything missed
    return `https://ui-avatars.com/api/?name=${playerTeam.abbr}&background=random&color=fff`;
};

const generateDummyGames = (sport: string, count: number): Game[] => {
    const sportTeams = REAL_TEAMS[sport] || [];
    const sportLogo = SPORT_LOGOS[sport] || SPORT_LOGOS['NBA'];

    return Array.from({ length: count }).map((_, i) => {
        const isLive = i < 2;
        const homeProb = Math.floor(Math.random() * 60) + 20;
        const awayProb = 100 - homeProb;

        const today = new Date();
        const gameDate = new Date(today);
        if (!isLive) {
            gameDate.setDate(today.getDate() + Math.floor(Math.random() * 5));
        }
        const dateString = gameDate.toISOString().split('T')[0];

        // Pick teams
        const awayIdx = (i * 2) % (sportTeams.length || 2);
        const homeIdx = (i * 2 + 1) % (sportTeams.length || 2);

        const awayTeamInfo = sportTeams[awayIdx] || { name: `${sport} Away ${i + 1}`, abbr: '' };
        const homeTeamInfo = sportTeams[homeIdx] || { name: `${sport} Home ${i + 1}`, abbr: '' };

        const BROADCAST_NETWORKS = ['ESPN', 'TNT', 'ABC', 'CBS', 'NBC', 'FOX', 'Prime Video', 'Apple TV+', 'Peacock', 'NBA League Pass'];
        const randomBroadcast = BROADCAST_NETWORKS[Math.floor(Math.random() * BROADCAST_NETWORKS.length)];

        return {
            id: `${sport}-${i + 1}`,
            sport,
            league: homeTeamInfo.league,
            sportLogo,
            status: isLive ? 'LIVE' : 'UPCOMING',
            timeLabel: isLive ? (sport === 'UFC' ? `Round ${Math.floor(Math.random() * 3) + 1} • In Progress` : sport === 'NCAAB' || sport === 'NBA' ? `H${Math.floor(Math.random() * 2) + 1} • 0${Math.floor(Math.random() * 9)}:${Math.floor(Math.random() * 60)}` : `Q${Math.floor(Math.random() * 4) + 1} • 0${Math.floor(Math.random() * 9)}:${Math.floor(Math.random() * 60)}`) : `Today • 0${Math.floor(Math.random() * 9) + 1}:00 PM`,
            matchupId: `#${sport}-${8290 + i}`,
            awayTeam: {
                id: `away-${i}`,
                name: awayTeamInfo.name,
                logo: awayTeamInfo.abbr ? getLogoUrl(sport, awayTeamInfo) : "",
                record: sport === 'UFC' ? `${Math.floor(Math.random() * 30)}-${Math.floor(Math.random() * 5)}` : `${Math.floor(Math.random() * 30)}-${Math.floor(Math.random() * 30)}`,
                color: 'text-primary',
                winProb: awayProb,
                recentForm: ['W', 'L', 'W', 'W', 'L'].sort(() => 0.5 - Math.random()) as ('W' | 'L')[],
                score: isLive ? Math.floor(Math.random() * (sport === 'Soccer' ? 4 : 120)) : undefined
            },
            homeTeam: {
                id: `home-${i}`,
                name: homeTeamInfo.name,
                logo: homeTeamInfo.abbr ? getLogoUrl(sport, homeTeamInfo) : "",
                record: sport === 'UFC' ? `${Math.floor(Math.random() * 30)}-${Math.floor(Math.random() * 5)}` : `${Math.floor(Math.random() * 30)}-${Math.floor(Math.random() * 30)}`,
                color: 'text-accent-purple',
                winProb: homeProb,
                recentForm: ['L', 'W', 'W', 'L', 'L'].sort(() => 0.5 - Math.random()) as ('W' | 'L')[],
                score: isLive ? Math.floor(Math.random() * (sport === 'Soccer' ? 4 : 120)) : undefined
            },
            odds: {
                moneyline: `+${Math.floor(Math.random() * 200) + 100}`,
                spread: `-${(Math.random() * 10).toFixed(1)}`,
                overUnder: { value: `${Math.floor(Math.random() * 50) + 200}.5`, pick: Math.random() > 0.5 ? 'Over' : 'Under' }
            },
            streakLabel: isLive ? 'HOT: Won 4' : 'STREAK: Neutral',
            date: dateString,
            venue: {
                name: `${homeTeamInfo.name || 'Local'} Stadium`,
                location: `${sport === 'NFL' || sport === 'NBA' || sport === 'MLB' || sport === 'NHL' ? 'USA' : 'Global'}`
            },
            broadcast: randomBroadcast
        };
    });
};

export const SPORTS = ['NBA', 'WNBA', 'NCAAB', 'NCAAW', 'NFL', 'MLB', 'NHL', 'Soccer', 'Tennis', 'Golf', 'UFC'];

export const mockGamesBySport: Record<string, Game[]> = SPORTS.reduce((acc, sport) => {
    const games = generateDummyGames(sport, 6);

    if (sport === 'NBA') {
        games[0].awayTeam.record = '24-10 (12-5 A)';
        games[0].awayTeam.winProb = 43;
        games[0].homeTeam.record = '34-10 (18-2 H)';
        games[0].homeTeam.winProb = 57;

        games[1].awayTeam.winProb = 26;
        games[1].homeTeam.winProb = 74;
        games[1].status = 'UPCOMING';
        games[1].timeLabel = 'Today • 10:00 PM';
    }

    acc[sport] = games;
    return acc;
}, {} as Record<string, Game[]>);
