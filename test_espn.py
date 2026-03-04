import requests
import json

def get_nba_complete_data():
    """Get teams, rosters, AND standings"""
    print("📥 Fetching NBA teams + rosters...")
    teams_url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?enable=roster"
    teams_data = requests.get(teams_url).json()
    
    print("📥 Fetching NBA standings...")
    standings_url = "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings"
    standings_data = requests.get(standings_url).json()
    
    print("📥 Fetching today's games...")
    scoreboard_url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
    scoreboard_data = requests.get(scoreboard_url).json()
    
    complete_data = {
        'teams_length': len(teams_data.get('sports', [])[0].get('leagues', [])[0].get('teams', [])),
        'standings_length': len(standings_data.get('children', [])),
        'games_length': len(scoreboard_data.get('events', [])),
    }
    
    print("Stats:")
    print(json.dumps(complete_data, indent=2))

get_nba_complete_data()
