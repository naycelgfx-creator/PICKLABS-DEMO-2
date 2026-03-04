from models import db, Pick, User

def auto_grade_bets():
    """Runs nightly to grade pending bets and update creator ROIs."""
    print("🚦 Initiating PickLabs Automated Grading Protocol...")

    # 1. Ask the database for EVERY bet that hasn't been graded yet
    pending_picks = Pick.query.filter_by(status='Pending').all()
    
    if not pending_picks:
        print("✅ No pending bets to grade tonight.")
        return

    # 2. Fetch yesterday's final game results from your API (e.g., API-Sports)
    # (In a real app, you'd pass the specific game IDs to the API)
    # final_scores = requests.get("https://v3.api-sports.io/games/finished...").json()
    
    # --- MOCK GRADING LOGIC FOR EXAMPLE ---
    for pick in pending_picks:
        # Here, your code compares the `pick.prop_type` to the `final_scores`
        # Let's pretend the Python logic determined this pick was a WIN.
        
        is_winner = True # (This would be determined by your actual API comparison)
        
        if is_winner:
            pick.status = 'Won'
            # If the odds were +100, they win 1 unit.
            pick.units_won = 1.0 
        else:
            pick.status = 'Lost'
            # They lost their risked unit
            pick.units_won = -1.0 

    # 3. Save all the new statuses to the database securely
    db.session.commit()
    print(f"✅ Successfully graded {len(pending_picks)} bets.")

    # 4. Recalculate the ROI for all creators who had bets graded tonight
    update_all_user_rois()

def update_all_user_rois():
    """Calculates the total ROI for every public creator."""
    users = User.query.filter_by(is_public=True).all()
    
    for user in users:
        total_risked = 0.0
        total_profit = 0.0
        
        # Look at every single bet this user has ever put in a Betlist
        for betlist in user.betlists:
            for pick in betlist.picks:
                if pick.status != 'Pending':
                    total_risked += pick.units_risked
                    total_profit += pick.units_won
                    
        # Prevent division by zero if they have no graded bets
        if total_risked > 0:
            # ROI Math Formula
            new_roi = (total_profit / total_risked) * 100
            user.verified_roi = round(new_roi, 2)
            
    db.session.commit()
    print("📈 All Creator ROIs updated successfully.")
