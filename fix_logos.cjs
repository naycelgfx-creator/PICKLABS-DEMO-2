const fs = require('fs');

const REAL_TEAMS = {
    NBA: [
        { name: 'Lakers', abbr: 'lal' }, { name: 'Celtics', abbr: 'bos' },
        { name: 'Suns', abbr: 'phx' }, { name: 'Nuggets', abbr: 'den' },
        { name: 'Warriors', abbr: 'gsw' }, { name: 'Bucks', abbr: 'mil' },
        { name: '76ers', abbr: 'phi' }, { name: 'Mavericks', abbr: 'dal' },
        { name: 'Clippers', abbr: 'lac' }, { name: 'Knicks', abbr: 'nyk' },
        { name: 'Heat', abbr: 'mia' }, { name: 'Cavaliers', abbr: 'cle' },
        { name: 'Kings', abbr: 'sac' }, { name: 'Pacers', abbr: 'ind' },
        { name: 'Timberwolves', abbr: 'min' }, { name: 'Hawks', abbr: 'atl' },
        { name: 'Nets', abbr: 'bkn' }, { name: 'Bulls', abbr: 'chi' },
        { name: 'Raptors', abbr: 'tor' }, { name: 'Pelicans', abbr: 'no' },
        { name: 'Sixers', abbr: 'phi' }, { name: 'Suns', abbr: 'phx' },
        { name: 'Thunder', abbr: 'okc' }, { name: 'Magic', abbr: 'orl' },
        { name: 'Grizzlies', abbr: 'mem' }, { name: 'Wizards', abbr: 'was' },
        { name: 'Hornets', abbr: 'cha' }, { name: 'Pistons', abbr: 'det' },
        { name: 'Spurs', abbr: 'sas' }, { name: 'Rockets', abbr: 'hou' }
    ],
    NFL: [
        { name: 'Chiefs', abbr: 'kc' }, { name: '49ers', abbr: 'sf' },
        { name: 'Ravens', abbr: 'bal' }, { name: 'Bills', abbr: 'buf' },
        { name: 'Eagles', abbr: 'phi' }, { name: 'Cowboys', abbr: 'dal' },
        { name: 'Lions', abbr: 'det' }, { name: 'Texans', abbr: 'hou' },
        { name: 'Jaguars', abbr: 'jax' }, { name: 'Dolphins', abbr: 'mia' },
        { name: 'Browns', abbr: 'cle' }, { name: 'Rams', abbr: 'lar' },
        { name: 'Colts', abbr: 'ind' }, { name: 'Buccaneers', abbr: 'tb' },
        { name: 'Packers', abbr: 'gb' }, { name: 'Seahawks', abbr: 'sea' },
        { name: 'Steelers', abbr: 'pit' }, { name: 'Bengals', abbr: 'cin' },
        { name: 'Texans', abbr: 'hou' }, { name: 'Broncos', abbr: 'den' },
        { name: 'Jets', abbr: 'nyj' }, { name: 'Saints', abbr: 'no' },
        { name: 'Vikings', abbr: 'min' }, { name: 'Raiders', abbr: 'lv' },
        { name: 'Falcons', abbr: 'atl' }, { name: 'Giants', abbr: 'nyg' },
        { name: 'Bears', abbr: 'chi' }, { name: 'Cardinals', abbr: 'ari' },
        { name: 'Commanders', abbr: 'was' }, { name: 'Patriots', abbr: 'ne' },
        { name: 'Panthers', abbr: 'car' }, { name: 'Titans', abbr: 'ten' }
    ],
    MLB: [
        { name: 'Dodgers', abbr: 'la' }, { name: 'Yankees', abbr: 'nyy' },
        { name: 'Braves', abbr: 'atl' }, { name: 'Orioles', abbr: 'bal' },
        { name: 'Astros', abbr: 'hou' }, { name: 'Rangers', abbr: 'tex' },
        { name: 'Brewers', abbr: 'mil' }, { name: 'Phillies', abbr: 'phi' },
        { name: 'Mariners', abbr: 'sea' }, { name: 'Cubs', abbr: 'chc' },
        { name: 'Red Sox', abbr: 'bos' }, { name: 'Diamondbacks', abbr: 'ari' },
        { name: 'Blue Jays', abbr: 'tor' }, { name: 'Rays', abbr: 'tb' },
        { name: 'Twins', abbr: 'min' }, { name: 'Giants', abbr: 'sf' },
        { name: 'Cardinals', abbr: 'stl' }, { name: 'Padres', abbr: 'sd' },
        { name: 'Guardians', abbr: 'cle' }, { name: 'Mets', abbr: 'nym' },
        { name: 'Angels', abbr: 'laa' }, { name: 'Red Sox', abbr: 'bos' },
        { name: 'White Sox', abbr: 'cws' }, { name: 'Rockies', abbr: 'col' },
        { name: 'Tigers', abbr: 'det' }, { name: 'Pirates', abbr: 'pit' },
        { name: 'Royals', abbr: 'kc' }, { name: 'Athletics', abbr: 'oak' },
        { name: 'Reds', abbr: 'cin' }, { name: 'Marlins', abbr: 'mia' }
    ],
    NHL: [
        { name: 'Avalanche', abbr: 'col' }, { name: 'Panthers', abbr: 'fla' },
        { name: 'Oilers', abbr: 'edm' }, { name: 'Stars', abbr: 'dal' },
        { name: 'Canucks', abbr: 'van' }, { name: 'Bruins', abbr: 'bos' },
        { name: 'Rangers', abbr: 'nyr' }, { name: 'Maple Leafs', abbr: 'tor' },
        { name: 'Jets', abbr: 'wpg' }, { name: 'Predators', abbr: 'nsh' },
        { name: 'Hurricanes', abbr: 'car' }, { name: 'Golden Knights', abbr: 'vgk' },
        { name: 'Lightning', abbr: 'tb' }, { name: 'Kings', abbr: 'la' },
        { name: 'Islanders', abbr: 'nyi' }, { name: 'Capitals', abbr: 'wsh' },
        { name: 'Flames', abbr: 'cgy' }, { name: 'Blues', abbr: 'stl' },
        { name: 'Devils', abbr: 'nj' }, { name: 'Kraken', abbr: 'sea' },
        { name: 'Wild', abbr: 'min' }, { name: 'Red Wings', abbr: 'det' },
        { name: 'Penguins', abbr: 'pit' }, { name: 'Sabres', abbr: 'buf' },
        { name: 'Senators', abbr: 'ott' }, { name: 'Coyotes', abbr: 'ari' },
        { name: 'Sharks', abbr: 'sj' }, { name: 'Blue Jackets', abbr: 'cbj' }
    ]
};

for (const sport of Object.keys(REAL_TEAMS)) {
    for (const team of REAL_TEAMS[sport]) {
        team.url = `https://a.espncdn.com/i/teamlogos/${sport.toLowerCase()}/500/${team.abbr.toLowerCase()}.png`;
    }
}

fs.writeFileSync('output_teams.json', JSON.stringify(REAL_TEAMS, null, 4));
console.log('done');
