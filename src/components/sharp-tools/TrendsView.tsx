// --- MOCK DATA FOR TRENDS ---

const hotTeams = [
    { rank: 1, name: "Boston Celtics", streak: "W11", stat: "18-2 L20 ATS", edge: "+8.5%" },
    { rank: 2, name: "Denver Nuggets", streak: "W8", stat: "10-0 Home ATS", edge: "+7.1%" },
    { rank: 3, name: "Dallas Mavericks", streak: "W6", stat: "8-2 L10 ATS", edge: "+6.4%" },
    { rank: 4, name: "Edmonton Oilers", streak: "W9", stat: "Puckline 7-3", edge: "+6.0%" },
    { rank: 5, name: "Baltimore Ravens", streak: "W5", stat: "Cover Margin +11", edge: "+5.7%" },
    { rank: 6, name: "NY Knicks", streak: "W5", stat: "Under in 8 of 10", edge: "+5.2%" },
    { rank: 7, name: "Florida Panthers", streak: "W4", stat: "12-3 Road ATS", edge: "+4.9%" },
    { rank: 8, name: "Oklahoma City", streak: "W4", stat: "Covered last 4", edge: "+4.5%" },
    { rank: 9, name: "Cleveland Cavaliers", streak: "W3", stat: "Def Rtg #1 L10", edge: "+4.1%" },
    { rank: 10, name: "Vancouver Canucks", streak: "W3", stat: "1st Period ML 8-2", edge: "+3.8%" },
];

const coldTeams = [
    { rank: 1, name: "Detroit Pistons", streak: "L14", stat: "2-18 L20 ATS", edge: "-11.2%" },
    { rank: 2, name: "San Jose Sharks", streak: "L9", stat: "0-10 Road ATS", edge: "-9.4%" },
    { rank: 3, name: "Washington Wizards", streak: "L7", stat: "Cover Margin -14", edge: "-8.7%" },
    { rank: 4, name: "Charlotte Hornets", streak: "L6", stat: "Over in 9 of 10", edge: "-7.5%" },
    { rank: 5, name: "Columbus Blue Jackets", streak: "L6", stat: "Puckline 2-8", edge: "-6.9%" },
    { rank: 6, name: "Carolina Panthers", streak: "L5", stat: "1-9 Away ML", edge: "-6.5%" },
    { rank: 7, name: "Portland Trail Blazers", streak: "L5", stat: "Failing to Cover by 8+", edge: "-6.1%" },
    { rank: 8, name: "Chicago Blackhawks", streak: "L4", stat: "0-5 Division ATS", edge: "-5.8%" },
    { rank: 9, name: "San Antonio Spurs", streak: "L4", stat: "Def Rtg #30", edge: "-5.3%" },
    { rank: 10, name: "Memphis Grizzlies", streak: "L3", stat: "2-8 Home ATS", edge: "-4.9%" },
];

const hotPlayers = [
    { rank: 1, name: "Nikola Jokic", prop: "O 9.5 AST", hitRate: "100%", streak: "10 Games", trend: "Avg 11.2" },
    { rank: 2, name: "Luka Doncic", prop: "O 32.5 PTS", hitRate: "90%", streak: "9 of L10", trend: "Avg 35.4" },
    { rank: 3, name: "Christian McCaffrey", prop: "Anytime TD", hitRate: "90%", streak: "9 of L10", trend: "14 Total" },
    { rank: 4, name: "Auston Matthews", prop: "O 3.5 SOG", hitRate: "85%", streak: "17 of L20", trend: "Avg 4.8" },
    { rank: 5, name: "Shai G-Alexander", prop: "O 1.5 STL", hitRate: "80%", streak: "8 of L10", trend: "Avg 2.4" },
    { rank: 6, name: "Jalen Brunson", prop: "O 28.5 PTS", hitRate: "80%", streak: "8 of L10", trend: "Avg 31.0" },
    { rank: 7, name: "Tyrese Haliburton", prop: "O 11.5 AST", hitRate: "75%", streak: "15 of L20", trend: "Avg 12.1" },
    { rank: 8, name: "Connor McDavid", prop: "O 1.5 PTS", hitRate: "70%", streak: "7 of L10", trend: "Avg 2.1" },
    { rank: 9, name: "Giannis Antetokounmpo", prop: "O 11.5 REB", hitRate: "70%", streak: "7 of L10", trend: "Avg 12.3" },
    { rank: 10, name: "CeeDee Lamb", prop: "O 85.5 REC YDS", hitRate: "70%", streak: "14 of L20", trend: "Avg 98.2" },
];

const propTrends = [
    { rank: 1, trend: "Starting Centers vs Lakers", outcome: "Hit OVER Rebounds", freq: "82%", stat: "14 of 17 Games" },
    { rank: 2, trend: "Backup PGs vs Pistons", outcome: "Hit OVER Assists", freq: "78%", stat: "18 of 23 Games" },
    { rank: 3, trend: "Away Teams @ Coors Field", outcome: "Hit OVER 1st 5 Run Line", freq: "75%", stat: "30 of 40 Games" },
    { rank: 4, trend: "Starting QBs vs Eagles", outcome: "Hit OVER Pass Yards", freq: "72%", stat: "13 of 18 Games" },
    { rank: 5, trend: "Top Line Centers vs SJ Sharks", outcome: "Hit OVER Points", freq: "70%", stat: "21 of 30 Games" },
    { rank: 6, trend: "Starting SG vs Bucks", outcome: "Hit OVER Made 3PT", freq: "68%", stat: "17 of 25 Games" },
    { rank: 7, trend: "Home Underdogs on TNF", outcome: "Cover the Spread", freq: "65%", stat: "13 of 20 Games" },
    { rank: 8, trend: "Teams off B2B vs Rested Opp.", outcome: "Hit UNDER Team Total", freq: "64%", stat: "45 of 70 Games" },
    { rank: 9, trend: "West Coast Teams playing East 1PM", outcome: "Hit UNDER 1H Total", freq: "62%", stat: "26 of 42 Games" },
    { rank: 10, trend: "Goalies facing >35 SOG Avg", outcome: "Hit OVER Saves", freq: "60%", stat: "36 of 60 Games" },
];


export default function TrendsView() {
    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-6 animate-fade-in pb-[120px]">
            {/* Header section matches Sharp Tools aesthetic */}
            <div className="mb-8">
                <h2 className="m-0 text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-4xl">trending_up</span>
                    AI Trend Analysis
                </h2>
                <p className="m-0 text-text-muted mt-2 text-lg max-w-2xl">
                    Macro and micro algorithmic trend spotting. The PickLabs engine automatically detects streaking entities, profitable situations, and systemic fades across all leagues to highlight actionable betting angles.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Hot Teams Box */}
                <div className="lab-card flex flex-col h-full border-t-[3px] border-t-primary">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">local_fire_department</span>
                            <h3 className="m-0 text-white font-bold text-xl uppercase tracking-wider">Hot Teams</h3>
                        </div>
                        <span className="text-xs font-mono text-text-muted bg-black/30 px-2 py-1 rounded border border-white/5">TOP 10 LIVE</span>
                    </div>

                    <div className="p-0 overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-black/20 text-text-muted font-mono text-[10px] uppercase tracking-widest">
                                <tr>
                                    <th className="font-medium p-4 py-3 border-b border-white/5 w-10 text-center">#</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5">Team</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5">Streak</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5 text-right">Metric</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5 text-right w-20">Edge</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hotTeams.map((team) => (
                                    <tr key={team.rank} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 text-center font-mono text-text-muted">{team.rank}</td>
                                        <td className="p-4 font-bold text-white group-hover:text-primary transition-colors">{team.name}</td>
                                        <td className="p-4">
                                            <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-xs font-mono font-bold">
                                                {team.streak}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-text-muted">{team.stat}</td>
                                        <td className="p-4 text-right font-mono font-bold text-primary">{team.edge}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cold Teams Box */}
                <div className="lab-card flex flex-col h-full border-t-[3px] border-t-accent-blue">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent-blue">ac_unit</span>
                            <h3 className="m-0 text-white font-bold text-xl uppercase tracking-wider">Cold Teams</h3>
                        </div>
                        <span className="text-xs font-mono text-text-muted bg-black/30 px-2 py-1 rounded border border-white/5">TOP 10 LIVE</span>
                    </div>

                    <div className="p-0 overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-black/20 text-text-muted font-mono text-[10px] uppercase tracking-widest">
                                <tr>
                                    <th className="font-medium p-4 py-3 border-b border-white/5 w-10 text-center">#</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5">Team</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5">Slump</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5 text-right">Metric</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5 text-right w-20">Fade Edge</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coldTeams.map((team) => (
                                    <tr key={team.rank} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 text-center font-mono text-text-muted">{team.rank}</td>
                                        <td className="p-4 font-bold text-white group-hover:text-accent-blue transition-colors">{team.name}</td>
                                        <td className="p-4">
                                            <span className="bg-accent-blue/10 text-accent-blue border border-accent-blue/20 px-2 py-0.5 rounded text-xs font-mono font-bold">
                                                {team.streak}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-text-muted">{team.stat}</td>
                                        <td className="p-4 text-right font-mono font-bold text-accent-blue">{team.edge}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Hot Players Box */}
                <div className="lab-card flex flex-col h-full border-t-[3px] border-t-yellow-400">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-400">star</span>
                            <h3 className="m-0 text-white font-bold text-xl uppercase tracking-wider">Hot Players</h3>
                        </div>
                        <span className="text-xs font-mono text-text-muted bg-black/30 px-2 py-1 rounded border border-white/5">TOP 10 LIVE</span>
                    </div>

                    <div className="p-0 overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-black/20 text-text-muted font-mono text-[10px] uppercase tracking-widest">
                                <tr>
                                    <th className="font-medium p-4 py-3 border-b border-white/5 w-10 text-center">#</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5">Player</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5">Target Prop</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5 text-right">Hit Rate</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hotPlayers.map((player) => (
                                    <tr key={player.rank} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 text-center font-mono text-text-muted">{player.rank}</td>
                                        <td className="p-4 font-bold text-white flex flex-col gap-0.5">
                                            <span className="group-hover:text-yellow-400 transition-colors">{player.name}</span>
                                            <span className="text-[10px] font-mono font-medium text-text-muted">{player.trend}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded text-xs font-mono font-bold">
                                                {player.prop}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className="font-mono font-bold text-white">{player.hitRate}</span>
                                                <div className="w-16 h-1 bg-white/10 rounded overflow-hidden">
                                                    <div className="h-full bg-yellow-400" style={{ width: player.hitRate }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono text-text-muted text-xs">{player.streak}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Macro Prop Trends Box */}
                <div className="lab-card flex flex-col h-full border-t-[3px] border-t-accent-purple">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent-purple">query_stats</span>
                            <h3 className="m-0 text-white font-bold text-xl uppercase tracking-wider">Prop Trends</h3>
                        </div>
                        <span className="text-xs font-mono text-text-muted bg-black/30 px-2 py-1 rounded border border-white/5">TOP 10 LIVE</span>
                    </div>

                    <div className="p-0 overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-black/20 text-text-muted font-mono text-[10px] uppercase tracking-widest">
                                <tr>
                                    <th className="font-medium p-4 py-3 border-b border-white/5 w-10 text-center">#</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5">Trend Scenario</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5">Outcome</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5 text-center">Hit %</th>
                                    <th className="font-medium p-4 py-3 border-b border-white/5 text-right">Sample</th>
                                </tr>
                            </thead>
                            <tbody>
                                {propTrends.map((trend) => (
                                    <tr key={trend.rank} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 text-center font-mono text-text-muted">{trend.rank}</td>
                                        <td className="p-4 font-bold text-white group-hover:text-accent-purple transition-colors truncate max-w-[200px]" title={trend.trend}>
                                            {trend.trend}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-accent-purple/10 text-accent-purple border border-accent-purple/20 px-2 py-0.5 rounded text-xs font-mono font-bold whitespace-nowrap">
                                                {trend.outcome}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center font-mono font-bold text-white">{trend.freq}</td>
                                        <td className="p-4 text-right font-mono text-text-muted text-xs whitespace-nowrap">{trend.stat}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
