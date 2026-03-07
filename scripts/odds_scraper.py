from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
import time

# Initialize Browser
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

def get_all_betting_options(target_url):
    driver.get(target_url)
    time.sleep(5) # Wait for odds to load

    # 1. Get the Game Names
    games = driver.find_elements(By.CLASS_NAME, "fixture-name") # Example class name
    
    # 2. Get the Odds Grid
    # Betting sites usually use a 'grid' or 'table' structure
    odds_cells = driver.find_elements(By.CSS_SELECTOR, "[class*='odds-value']") 

    results = []
    for i in range(len(games)):
        game_info = {
            "match": games[i].text,
            "odds": [cell.text for cell in odds_cells[i*2:(i*2)+2]] # Grabs Home/Away odds
        }
        results.append(game_info)
    
    return results

# Run it
my_odds = get_all_betting_options("https://oddsindex.com/betting-odds")
for item in my_odds:
    print(f"Match: {item['match']} | Odds: {item['odds']}")

driver.quit()
