from datetime import datetime, timedelta
from collections import defaultdict
from dateutil.relativedelta import relativedelta
from app.models import Transaction, Savings_Goals
from app import db
from sqlalchemy import func

def calculate_total_income(user_id):
    return db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'income'
    ).scalar() or 0

def calculate_total_expenses(user_id):
    return db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'expense'
    ).scalar() or 0

def calculate_net_worth(user_id):
    income = calculate_total_income(user_id)
    expenses = calculate_total_expenses(user_id)    
    return income - expenses 

def get_expense_total(user_id):
    expense_total = db.session.query(
        func.coalesce(func.sum(Transaction.amount), 0.0)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type != 'income'
    ).scalar()
    return expense_total

def get_monthly_data_by_user(user_id):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)  # 6 months
    
    income_query = db.session.query(
        db.func.strftime('%Y-%m', Transaction.date).label('month'),
        db.func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'income',
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).group_by('month').order_by('month')
    
    expense_query = db.session.query(
        db.func.strftime('%Y-%m', Transaction.date).label('month'),
        db.func.sum(Transaction.amount).label('total')
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'expense',
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).group_by('month').order_by('month')
    
    income_data = {row.month: row.total for row in income_query}
    expense_data = {row.month: row.total for row in expense_query}
    
    all_months = sorted(set(income_data.keys()).union(set(expense_data.keys())))
    
    monthly_data = {
        'labels': [],
        'income': [],
        'expenses': []
    }
    
    for month in all_months:
        monthly_data['labels'].append(month)
        monthly_data['income'].append(income_data.get(month, 0))
        monthly_data['expenses'].append(expense_data.get(month, 0))
    
    return monthly_data

def get_monthly_data(transactions):
    monthly_income = defaultdict(float)
    monthly_expenses = defaultdict(float)
    
    for t in transactions:
        month = t.date.strftime('%b %Y')
        if t.type == 'income':
            monthly_income[month] += t.amount
        else:
            monthly_expenses[month] += t.amount
            
    all_months = sorted(set(monthly_income.keys()).union(set(monthly_expenses.keys())),
                      key=lambda m: datetime.strptime(m, '%b %Y'))
    
    return {
        'labels': all_months,
        'income': [monthly_income.get(m, 0) for m in all_months],
        'expenses': [monthly_expenses.get(m, 0) for m in all_months]
    }

def get_category_data(transactions):
    category_totals = defaultdict(float)
    for t in transactions:
        if t.type == 'expense':
            category_totals[t.category] += t.amount
            
    categories = list(category_totals.keys())
    amounts = [category_totals[c] for c in categories]
    colors = ['#f72585', '#4cc9f0', '#4361ee', '#7209b7', '#3a0ca3', '#4895ef']
    
    return {
        'labels': categories,
        'amounts': amounts,
        'colors': colors[:len(categories)]
    }

def get_net_worth_data(user_id, transactions, savings_goals):
    net_worth_history = []
    today = datetime.now()
    
    for i in range(6, -1, -1):
        month = today - relativedelta(months=i)
        month_str = month.strftime('%b %Y')
        
        income = sum(t.amount for t in transactions 
                   if t.type == 'income' and t.date <= month.replace(day=1, hour=23, minute=59, second=59))
        
        expenses = sum(t.amount for t in transactions 
                     if t.type == 'expense' and t.date <= month.replace(day=1, hour=23, minute=59, second=59))
        
        savings = sum(s.currentamount for s in savings_goals 
                     if s.startdate <= month.replace(day=1, hour=23, minute=59, second=59))
        
        net_worth = income - expenses + savings
        net_worth_history.append({
            'date': month_str,
            'value': net_worth
        })
    
    return {
        'labels': [entry['date'] for entry in net_worth_history],
        'values': [entry['value'] for entry in net_worth_history]
    }

def get_cash_flow_data(transactions):
    weekly_income = defaultdict(float)
    weekly_expenses = defaultdict(float)
    
    for t in transactions:
        week = f"Week {t.date.isocalendar()[1]}"
        if t.type == 'income':
            weekly_income[week] += t.amount
        else:
            weekly_expenses[week] += t.amount
            
    weeks = sorted(set(weekly_income.keys()).union(set(weekly_expenses.keys())))
    
    return {
        'labels': weeks,
        'income': [weekly_income.get(w, 0) for w in weeks],
        'expenses': [weekly_expenses.get(w, 0) for w in weeks]
    }

def icon_class_filter(source):
    icons = {
        'salary': 'fa-briefcase',
        'freelance': 'fa-laptop-code',
        'investment': 'fa-chart-line',
        'business': 'fa-store',
        'other': 'fa-money-bill-wave'
    }
    return icons.get(source.lower(), 'fa-money-bill-wave')
