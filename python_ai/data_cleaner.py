def extract_clean_sports_data(espn_json, league):
    """
    Takes raw ESPN API JSON and standardizes it for the PickLabs database.
    Fixes the missing player bug and the mixed-up logo bug.
    """
    clean_players = []
    
    # 🏀 BASKETBALL ROUTING
    if league == 'nba':
        # ESPN buries NBA players deep inside 'events' -> 'competitions' -> 'competitors'
        try:
            for event in espn_json.get('events', []):
                for competition in event.get('competitions', []):
                    for team in competition.get('competitors', []):
                        team_id = team['team']['id']
                        
                        # Sometimes NBA players are listed under 'roster' or 'statistics'
                        roster = team.get('roster', [])
                        if not roster:
                            # Fallback if ESPN hides them somewhere else today
                            roster = team.get('statistics', [])
                            
                        for athlete in roster:
                            # Standardize the output
                            clean_players.append({
                                'player_name': athlete['athlete']['displayName'],
                                'team_id': team_id,
                                'league': 'nba', # THIS PREVENTS LOGO COLLISIONS
                                'logo_url': f"https://a.espncdn.com/i/teamlogos/nba/500/{team_id}.png"
                            })
        except KeyError as e:
            print(f"ESPN changed their NBA JSON structure again. Missing: {e}")

    # 🏒 HOCKEY ROUTING
    elif league == 'nhl':
        # ESPN keeps NHL data slightly cleaner, but structured differently
        try:
            for event in espn_json.get('events', []):
                for competition in event.get('competitions', []):
                    for team in competition.get('competitors', []):
                        team_id = team['team']['id']
                        
                        # NHL players are usually right inside the team object
                        for athlete in team.get('roster', []):
                            clean_players.append({
                                'player_name': athlete['athlete']['displayName'],
                                'team_id': team_id,
                                'league': 'nhl', # THE HOCKEY TAG
                                'logo_url': f"https://a.espncdn.com/i/teamlogos/nhl/500/{team_id}.png"
                            })
        except KeyError as e:
            print(f"ESPN NHL data error. Missing: {e}")

    return clean_players
