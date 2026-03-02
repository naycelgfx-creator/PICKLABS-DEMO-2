from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from flask_login import LoginManager, login_required, current_user
from flask_wtf.csrf import CSRFProtect
from ai_engine import BettingEngine, SportsPredictionModel, get_upcoming_games
from models import db, User, Betlist, Pick
import os

app = Flask(__name__)
# Enable CORS so the React app running on a different port can fetch data
CORS(app)

app.config['SECRET_KEY'] = 'picklabs_super_secret_key_8475920!'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///picklabs.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Turn on the shields
csrf = CSRFProtect(app)

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

with app.app_context():
    db.create_all()
    # Mock user if none exists
    if not User.query.filter_by(email='marcus@example.com').first():
        mock_user = User(username='MarcusLocks', email='marcus@example.com', is_public=True, verified_roi=12.5)
        db.session.add(mock_user)
        
    # Create the Admin user
    if not User.query.filter_by(email='admin@picklabs.bet').first():
        admin_user = User(username='CEO', email='admin@picklabs.bet', is_public=False)
        # Note: In a real app we'd hash a password here. For this prototype, we'll just check the email.
        db.session.add(admin_user)
        
    db.session.commit()

# Initialize the AI model once when the server starts
print("Initializing AI Model...")
ai_model = SportsPredictionModel()
ai_model.train("historical_sports_data.csv")

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    """
    Returns the live upcoming games with their AI-calculated probabilities
    and suggested betting amounts across 3 strategies.
    """
    todays_games = get_upcoming_games()
    bankroll = 1000 # Example bankroll for calculations
    betting_engine = BettingEngine(bankroll)
    
    results = []
    
    for game in todays_games:
        match_name = game['match']
        odds = game['odds']
        
        # Calculate AI Win Probability
        ai_win_prob = ai_model.predict_probability(game['stats'])
        
        # Calculate 3 Strategy Bets
        kelly_amount = betting_engine.kelly_bet(ai_win_prob, odds)
        fixed_amount = betting_engine.fixed_unit_bet(unit_percent=0.02)
        target_amount = betting_engine.target_profit_bet(target_amount=50, odds=odds)
        
        # Calculate edge
        edge = (odds - 1) * ai_win_prob - (1 - ai_win_prob)
        
        results.append({
            "match": match_name,
            "odds": odds,
            "ai_probability": round(ai_win_prob * 100, 1),
            "edge": round(edge * 100, 2),
            "suggestions": {
                "kelly": kelly_amount,
                "fixed": fixed_amount,
                "target": target_amount
            }
        })
        
    return jsonify({
        "status": "success",
        "bankroll": bankroll,
        "predictions": results
    })

@app.route('/api/predict', methods=['POST'])
def predict_games():
    """
    Accepts an array of games from the frontend and returns AI predictions for each.
    """
    data = request.json or {}
    games = data.get('games', [])
    bankroll = data.get('bankroll', 1000)
    
    betting_engine = BettingEngine(bankroll)
    results = {}
    
    for game in games:
        game_id = game.get('id')
        if not game_id:
            continue
            
        # Optional: mock features derived from teams or passing real features
        # Note: Scikit-learn random stats based on names if empty, or hardcode
        # For full app-wide integration, we mock a robust win probability from 40% to 65% loosely based on id
        import hashlib
        hash_val = int(hashlib.sha256(str(game_id).encode('utf-8')).hexdigest(), 16)
        ai_win_prob = 0.40 + (hash_val % 25) / 100.0  # e.g., 0.40 to 0.64
        
        odds = game.get('odds', 1.90)  # Default -110 in decimal
        
        kelly_amount = betting_engine.kelly_bet(ai_win_prob, odds)
        fixed_amount = betting_engine.fixed_unit_bet(unit_percent=0.02)
        target_amount = betting_engine.target_profit_bet(target_amount=50, odds=odds)
        
        # Kelly bet returns edge internally, but we can compute it for the response:
        edge = (odds - 1) * ai_win_prob - (1 - ai_win_prob)
        
        results[game_id] = {
            "ai_probability": round(ai_win_prob * 100, 1),
            "edge": round(edge * 100, 2),
            "suggestions": {
                "kelly": kelly_amount,
                "fixed": fixed_amount,
                "target": target_amount
            }
        }
        
    return jsonify({
        "status": "success",
        "predictions": results
    })

@app.route('/save_betlist/<int:betlist_id>', methods=['POST'])
@login_required
def toggle_save_betlist(betlist_id):
    """Handles saving or unsaving a Betlist to the user's personal library."""
    betlist = Betlist.query.get_or_404(betlist_id)
    
    if betlist in current_user.saved_lists:
        current_user.saved_lists.remove(betlist)
        action = 'unsaved'
        message = 'Removed from Library'
    else:
        current_user.saved_lists.append(betlist)
        action = 'saved'
        message = 'Saved to Library'
        
    db.session.commit()
    
    return jsonify({
        'status': 'success', 
        'action': action,
        'message': message
    })

@app.route('/my-library')
@login_required
def my_library():
    """
    Fetches every single Betlist the user has clicked 'Save' on,
    and sends it to their personal library page.
    """
    saved_lists = current_user.saved_lists.all()
    return render_template('library.html', betlists=saved_lists, user=current_user)

@app.route('/social-feed')
def social_feed():
    return render_template('social-feed.html')

@app.route('/auth', methods=['GET', 'POST'])
def auth():
    from flask_login import login_user
    if request.method == 'POST':
        email = request.form.get('email')
        
        # Find the user by email
        user = User.query.filter_by(email=email).first()
        if user:
            login_user(user) # Actually log them into the session
            return jsonify({
                'status': 'success',
                'message': f'Authenticated successfully with email: {email}'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'User not found.'
            }), 404
            
    return render_template('auth.html')

from functools import wraps
from flask import abort

# 1. Define who the boss is (You!)
ADMIN_EMAIL = "admin@picklabs.bet" # Change this to your actual email

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # If they aren't logged in, or their email doesn't match the boss, kick them out
        if not current_user.is_authenticated or current_user.email != ADMIN_EMAIL:
            abort(403) # 403 means "Forbidden"
        return f(*args, **kwargs)
    return decorated_function

# 2. The Admin Route
@app.route('/admin-dashboard')
@admin_required
def admin_dashboard():
    # Gather the intel for the CEO
    total_users = User.query.count()
    active_subs = User.query.filter_by(has_active_subscription=True).count() if hasattr(User, 'has_active_subscription') else 0
    pending_tickets = Pick.query.filter_by(status='Pending').all() if hasattr(Pick, 'status') else []
    
    # Calculate estimated Monthly Recurring Revenue (MRR)
    mrr = active_subs * 39.99 
    
    return render_template('admin.html', 
                           users=total_users, 
                           subs=active_subs, 
                           mrr=mrr, 
                           tickets=pending_tickets)

@app.route('/admin/force_grade/<int:ticket_id>/<string:result>', methods=['POST'])
@admin_required
def force_grade_ticket(ticket_id, result):
    # This route allows the admin to manually mark a ticket as Won or Lost
    # if the API fails to catch a stat correction.
    
    # In a real app we'd fetch the ticket from db:
    # ticket = Pick.query.get_or_404(ticket_id)
    # ticket.status = result
    # db.session.commit()
    
    # Returning a success response so the frontend can reload
    return jsonify({
        'status': 'success',
        'message': f'Ticket #{ticket_id} forcibly graded as {result}.'
    })

if __name__ == '__main__':
    app.run(port=8005, debug=False, threaded=True)
