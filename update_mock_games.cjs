const fs = require('fs');

const outputTeams = require('./output_teams.json');

let mockGamesContent = fs.readFileSync('src/data/mockGames.ts', 'utf-8');

// Helper to stringify an array of objects to match the TS format
function arrayToTsString(arr) {
    return '[\n        ' + arr.map(team =>
        `{ name: '${team.name}', abbr: '${team.abbr}', url: '${team.url}' }`
    ).join(',\n        ') + '\n    ]';
}

const nbaString = arrayToTsString(outputTeams.NBA);
const nflString = arrayToTsString(outputTeams.NFL);
const mlbString = arrayToTsString(outputTeams.MLB);
const nhlString = arrayToTsString(outputTeams.NHL);

mockGamesContent = mockGamesContent.replace(/NBA:\s*\[[\s\S]*?\],\n\s*NFL:/, `NBA: ${nbaString},\n    NFL:`);
mockGamesContent = mockGamesContent.replace(/NFL:\s*\[[\s\S]*?\],\n\s*MLB:/, `NFL: ${nflString},\n    MLB:`);
mockGamesContent = mockGamesContent.replace(/MLB:\s*\[[\s\S]*?\],\n\s*NHL:/, `MLB: ${mlbString},\n    NHL:`);
mockGamesContent = mockGamesContent.replace(/NHL:\s*\[[\s\S]*?\],\n\s*Soccer:/, `NHL: ${nhlString},\n    Soccer:`);

fs.writeFileSync('src/data/mockGames.ts', mockGamesContent);
console.log('Successfully updated mockGames.ts');
