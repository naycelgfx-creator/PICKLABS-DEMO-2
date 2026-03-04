from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# 1. THE FOLLOWER SYSTEM (The Social Graph)
followers = db.Table('followers',
    db.Column('follower_id', db.Integer, db.ForeignKey('users.id')),
    db.Column('followed_id', db.Integer, db.ForeignKey('users.id'))
)

# 2. THE SAVED PLAYLISTS (The "Library")
saved_betlists = db.Table('saved_betlists',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
    db.Column('betlist_id', db.Integer, db.ForeignKey('betlists.id'))
)

# --- THE UPDATED USER TABLE ---
from flask_login import UserMixin

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False) # e.g., @MarcusLocks
    email = db.Column(db.String(120), unique=True, nullable=False)
    
    # The Opt-In Privacy Toggle you requested!
    is_public = db.Column(db.Boolean, default=False) 
    verified_roi = db.Column(db.Float, default=0.0) # e.g., +12.5%
    
    # The Network Links
    betlists = db.relationship('Betlist', backref='creator', lazy='dynamic')
    saved_lists = db.relationship('Betlist', secondary=saved_betlists, backref='saved_by_users', lazy='dynamic')
    
    # The magic code that lets users follow each other
    followed = db.relationship(
        'User', secondary=followers,
        primaryjoin=(followers.c.follower_id == id),
        secondaryjoin=(followers.c.followed_id == id),
        backref=db.backref('followers', lazy='dynamic'), lazy='dynamic'
    )

    def follow(self, user):
        if not self.is_following(user):
            self.followed.append(user)

    def unfollow(self, user):
        if self.is_following(user):
            self.followed.remove(user)

    def is_following(self, user):
        return self.followed.filter(followers.c.followed_id == user.id).count() > 0

# 3. THE "PLAYLIST" (The Betlist)
class Betlist(db.Model):
    __tablename__ = 'betlists'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    title = db.Column(db.String(100), nullable=False) # e.g., "Sunday NFL Locks 🔒"
    description = db.Column(db.String(250))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # The "Songs" inside the playlist
    picks = db.relationship('Pick', backref='betlist', lazy='dynamic', cascade="all, delete-orphan")

# 4. THE "SONGS" (The Individual Bets)
class Pick(db.Model):
    __tablename__ = 'picks'
    id = db.Column(db.Integer, primary_key=True)
    betlist_id = db.Column(db.Integer, db.ForeignKey('betlists.id'))
    
    # The actual bet data
    game_id = db.Column(db.String(50), nullable=False)
    player_name = db.Column(db.String(100))
    prop_type = db.Column(db.String(50)) # e.g., "Over 26.5 Points"
    sportsbook = db.Column(db.String(50)) # e.g., "DraftKings"
    odds = db.Column(db.String(10)) # e.g., "+110"
    
    # The new grading column. Defaults to 'Pending' when created.
    status = db.Column(db.String(20), default='Pending') 
    
    # We also need to know how much risk/reward was attached to calculate ROI
    units_risked = db.Column(db.Float, default=1.0)
    units_won = db.Column(db.Float, default=0.0)
