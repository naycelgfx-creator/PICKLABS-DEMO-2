import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
import os
import random

# --- 1. BETTING STRATEGY ENGINE ---
class BettingEngine:
    def __init__(self, bankroll):
        self.bankroll = bankroll

    def kelly_bet(self, p, odds, safety_fraction=0.25):
        """
        Calculates the recommended bet size using the Fractional Kelly Criterion.
        p = Win probability (from 0.0 to 1.0)
        odds = The payout decimal odds (e.g. 1.95)
        safety_fraction = Multiplier for safety (0.25 = Quarter Kelly)
        """
        b = odds - 1
        q = 1 - p
        
        # Kelly Formula: f = (bp - q) / b
        edge = (b * p) - q
        
        if edge > 0:
            f_star = edge / b
            bet_amount = f_star * self.bankroll * safety_fraction
            return round(bet_amount, 2), round(edge * 100, 2)
        return 0, 0 # No mathematical edge

    def fixed_unit_bet(self, unit_percent=0.02):
        """The Pro choice: bets a fixed percentage (e.g. 2%) of bankroll every time."""
        return round(self.bankroll * unit_percent, 2)

    def target_profit_bet(self, target_amount, odds):
        """Bet exactly enough to win a specific target amount, capped at 10% of bankroll."""
        stake = target_amount / (odds - 1)
        # Safety check: don't bet more than 10% of bankroll
        return round(min(stake, self.bankroll * 0.10), 2)

# --- 2. THE AI MODEL (XGBOOST) ---
class SportsPredictionModel:
    def __init__(self):
        # We initialize the XGBoost Classifier
        self.model = xgb.XGBClassifier(n_estimators=100, learning_rate=0.1, objective='binary:logistic')
        self.is_trained = False
        
    def train(self, csv_path):
        if not os.path.exists(csv_path):
            print(f"⚠️ Warning: {csv_path} not found. Model needs data to train!")
            return False
            
        print(f"📊 Loading historical sports data from {csv_path}...")
        try:
            data = pd.read_csv(csv_path)
            X = data.drop('is_home_win', axis=1) # The Stats/Features
            y = data['is_home_win']              # Target (1 = Win, 0 = Loss)
            
            # Splitting data for training vs testing
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            print("🧠 Training XGBoost AI Model (Learning from Stats)...")
            self.model.fit(X_train, y_train)
            self.is_trained = True
            
            # Simple accuracy check
            accuracy = self.model.score(X_test, y_test)
            print(f"✅ Model trained successfully! (Test Accuracy: {accuracy*100:.1f}%)")
            return True
        except Exception as e:
            print(f"❌ Error training model: {e}")
            return False
            
    def predict_probability(self, game_features):
        """
        Takes the stats of an upcoming game and uses the trained model to predict the home team's win probability.
        """
        if not self.is_trained:
            print("Warning: Model is untrained, reverting to 50% probability.")
            return 0.5 
            
        df = pd.DataFrame([game_features])
        # Returns the probability of the Positive Class [1] (Home Win)
        return float(self.model.predict_proba(df)[:, 1][0])

# --- 3. SYNTHETIC DATA GENERATOR ---
# Because there is no raw CSV provided, we will synthesize a historical dataset so
# the model can actually train and learn how stats relate to winning, allowing the script to run seamlessly out of the box.
def build_synthetic_data(csv_name="historical_sports_data.csv"):
    if os.path.exists(csv_name):
        return # Skip if already generated
        
    print(f"🛠️ Generating synthetic historical data ({csv_name}) for the AI to learn from...")
    data = []
    # Simulating 1000 past basketball/soccer games
    for _ in range(1000):
        # Home Win Rate (0.20 to 0.80)
        home_win_rate = random.uniform(0.2, 0.8)
        # Away Win Rate (0.20 to 0.80)
        away_win_rate = random.uniform(0.2, 0.8)
        # Average Points Difference
        avg_points_diff = (home_win_rate - away_win_rate) * 25 + random.uniform(-8, 8)
        
        # Calculate actual chance of winning based on the simulated metrics
        true_chance = 0.5 + (home_win_rate - away_win_rate) * 0.4
        
        # Simulate final game result 
        is_home_win = 1 if random.random() < true_chance else 0
        data.append([home_win_rate, away_win_rate, avg_points_diff, is_home_win])
        
    df = pd.DataFrame(data, columns=['home_win_rate', 'away_win_rate', 'avg_points_diff', 'is_home_win'])
    df.to_csv(csv_name, index=False)
    print(f"✅ Created {len(df)} historical game records.\n")


# --- 4. FETCHING UPCOMING GAMES ---
def get_upcoming_games():
    """
    Simulates fetching matches from an API like Arena or Outlier.
    To make these real, you would use BeautifulSoup or Selenium here 
    to scrape the live stats and odds for tonight's games.
    """
    print("📡 Fetching today's upcoming games and sports odds...")
    return [
        {"match": "Lakers vs Celtics", "odds": 1.95, "stats": {"home_win_rate": 0.65, "away_win_rate": 0.55, "avg_points_diff": 4.5}},
        {"match": "Man City vs Arsenal", "odds": 2.40, "stats": {"home_win_rate": 0.70, "away_win_rate": 0.80, "avg_points_diff": -1.2}},
        {"match": "Knicks vs Bulls", "odds": 1.85, "stats": {"home_win_rate": 0.50, "away_win_rate": 0.45, "avg_points_diff": 1.5}},
        {"match": "Heat vs Magic", "odds": 2.10, "stats": {"home_win_rate": 0.40, "away_win_rate": 0.60, "avg_points_diff": -5.1}},
    ]


# --- 5. EXECUTION ---
def run_picklabs_ai(bankroll=1000):
    print("="*50)
    print("🤖 PICKLABS AI BETTING ENGINE OVERSEER")
    print("="*50)
    print(f"💰 Initial Bankroll: ${bankroll:,.2f}\n")
    
    # 1. Setup Data for the AI (Creates the CSV)
    build_synthetic_data()
    
    # 2. Initialize and Train the XGBoost Model
    ai = SportsPredictionModel()
    ai.train("historical_sports_data.csv")
    
    # 3. Initialize the Betting Engine strategy manager
    betting_engine = BettingEngine(bankroll)
    
    # 4. Retrieve Live Games (Mocked for Now)
    todays_games = get_upcoming_games()
    
    print("\n--- 🎯 AI PREDICTIONS & BETTING SUGGESTIONS ---")
    for game in todays_games:
        match_name = game['match']
        odds = game['odds']
        
        # The AI looks at the stats and calculates exactly how likely the home team is to win
        ai_win_prob = ai.predict_probability(game['stats'])
        
        # Get bet suggestions from our 3 different strategies
        kelly_amount, edge = betting_engine.kelly_bet(ai_win_prob, odds)
        fixed_amount = betting_engine.fixed_unit_bet(unit_percent=0.02)
        target_amount = betting_engine.target_profit_bet(target_amount=50, odds=odds)
        
        print(f"\n🏟  {match_name.upper()}")
        print(f"  ↳ Vegas Odds: {odds}")
        print(f"  ↳ AI Expected Probability: {ai_win_prob * 100:.1f}%")
        
        if kelly_amount > 0:
            print(f"  ↳ 📈 MATHEMATICAL EDGE FOUND! (+{edge}% advantage)")
        else:
            print(f"  ↳ 🛑 NO MATHEMATICAL EDGE. (Kelly recommends skipping)")

        print("  💡 Strategy Options:")
        print(f"     • Kelly (Safe/Dynamic): ${kelly_amount:.2f}")
        print(f"     • Fixed Unit (2%):      ${fixed_amount:.2f}")
        print(f"     • Target Profit ($50):  ${target_amount:.2f}")

if __name__ == "__main__":
    # Start the engine
    run_picklabs_ai(bankroll=1000)
    print("\n" + "="*50)
    print("PROCESS COMPLETE")
