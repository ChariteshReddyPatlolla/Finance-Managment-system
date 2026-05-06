from sqlalchemy.sql import func
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone
from app import db

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    user_id = db.Column('userId', db.Integer, primary_key=True, autoincrement=True)
    username = db.Column('userName', db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=func.now())
    transactions = db.relationship(
        'Transaction', 
        backref='user', 
        lazy=True,  
        cascade='all, delete-orphan',  
        passive_deletes=True           
    )
    profile = db.relationship(
        'User_Profile', 
        backref='user', 
        uselist=False,
        cascade='all, delete-orphan',
        passive_deletes=True
    )
    
    savings_goals = db.relationship(
        'Savings_Goals', 
        backref='user', 
        lazy=True,
        cascade='all, delete-orphan',
        passive_deletes=True
    )
    
    saving_transactions = db.relationship(
        'SavingTransaction', 
        backref='user', 
        lazy=True,
        cascade='all, delete-orphan',
        passive_deletes=True
    )
    def get_id(self):
        return str(self.user_id)

    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    def set_password(self, password):
        self.password = generate_password_hash(password, method='scrypt')

class User_Profile(db.Model):
    __tablename__ = 'user_profile'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.userId', ondelete='CASCADE'), unique=True)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    street = db.Column(db.String(100))
    city = db.Column(db.String(50))
    zip_code = db.Column(db.String(20))
    country = db.Column(db.String(50))


class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(10), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(db.String(20), default='completed')
    user_id = db.Column('userId', db.Integer, db.ForeignKey('users.userId', ondelete='CASCADE'), nullable=False)
    
    
class Savings_Goals(db.Model):
    __tablename__ = 'savings_goals'
    
    goal_id = db.Column('goalId', db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column('userId', db.Integer, db.ForeignKey('users.userId', ondelete='CASCADE'), nullable=False)
    goalname = db.Column('goalName', db.String(100), nullable=False)
    currentamount = db.Column('currentAmount', db.Float, nullable=False)
    targetamount = db.Column('targetAmount', db.Float, nullable=False)
    startdate = db.Column('startDate', db.DateTime, default=datetime.now(timezone.utc))
    priority = db.Column('priority', db.String(10))
    deadline = db.Column(db.DateTime, nullable=False)
    notes = db.Column(db.String(255))
    transactions = db.relationship('SavingTransaction', backref='goal', lazy=True, cascade='all, delete-orphan')

class SavingTransaction(db.Model):
    __tablename__ = 'saving_transaction'

    transaction_id = db.Column('transactionId', db.Integer, primary_key=True, autoincrement=True)
    goal_id = db.Column('goalId', db.Integer, db.ForeignKey('savings_goals.goalId', ondelete='CASCADE'), nullable=False)
    user_id = db.Column('userId', db.Integer, db.ForeignKey('users.userId', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column('receivedDate', db.TIMESTAMP, server_default=func.now())
    note = db.Column(db.String(255))
