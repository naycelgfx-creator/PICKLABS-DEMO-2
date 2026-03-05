const fetchRoster = async () => {
    const url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/17/roster";
    const res = await fetch(url);
    const data = await res.json();
    const allAthletes = [];
    if (Array.isArray(data.athletes)) {
        for (const entry of data.athletes) {
            if (entry.fullName || entry.displayName) {
                if (entry.id) allAthletes.push(entry);
            } else if (Array.isArray(entry.items)) {
                for (const athlete of entry.items) {
                    if (athlete.id) allAthletes.push(athlete);
                }
            } else if (entry.id) {
                allAthletes.push(entry);
            }
        }
    }
    console.log(allAthletes.length);
};
fetchRoster();
