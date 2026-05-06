from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
import json
from datetime import datetime, timedelta
from app.models import Transaction, Savings_Goals, User_Profile
from app.utils import icon_class_filter, get_expense_total, get_monthly_data, get_category_data, get_net_worth_data, get_cash_flow_data
from collections import defaultdict
from app import db

main_bp = Blueprint('main', __name__)

@main_bp.app_template_filter('icon_class')
def icon_class(source):
    return icon_class_filter(source)

@main_bp.route('/dashboard')
@login_required
def dashboard():
    try:
        transactions = Transaction.query.filter_by(user_id=current_user.user_id).order_by(Transaction.date.desc()).all()
        
        total_income = sum(t.amount for t in transactions if t.type == 'income')
        total_expenses = sum(t.amount for t in transactions if t.type == 'expense')
        savings_goals = Savings_Goals.query.filter_by(user_id=current_user.user_id).all()
        total_savings = sum(s.currentamount for s in savings_goals) if savings_goals else 0
        total_investments = sum(t.amount for t in transactions if t.type == 'income' and t.category.lower() == 'investment')
        
        monthly_data = defaultdict(lambda: {'income': 0, 'expense': 0})
        six_months_ago = datetime.now() - timedelta(days=180)
        
        for t in transactions:
            if t.date >= six_months_ago:
                month_year = t.date.strftime('%b %Y')
                monthly_data[month_year][t.type] += t.amount
        
        sorted_months = sorted(monthly_data.keys(), key=lambda x: datetime.strptime(x, '%b %Y'))
        spending_labels = sorted_months
        spending_income = [monthly_data[m]['income'] for m in sorted_months]
        spending_expenses = [monthly_data[m]['expense'] for m in sorted_months]
        
        expense_categories = defaultdict(float)
        for t in transactions:
            if t.type == 'expense':
                expense_categories[t.category] += t.amount
        
        expense_labels = list(expense_categories.keys())
        expense_values = list(expense_categories.values())
        
        spending_data = {
            'labels': spending_labels,
            'income': spending_income,
            'expenses': spending_expenses
        }
        
        expense_dist_data = {
            'labels': expense_labels,
            'values': expense_values
        }
        
        return render_template(
            'dashboard.html',
            total_income=total_income,
            total_expenses=total_expenses,
            total_savings=total_savings,
            total_investments=total_investments,
            transactions=transactions[:10],
            spending_data=json.dumps(spending_data),
            expense_dist_data=json.dumps(expense_dist_data)
        )
        
    except Exception as e:
        return render_template('error.html', error=str(e)), 500

@main_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    all_transactions = Transaction.query.filter_by(
        user_id=current_user.user_id
    ).order_by(Transaction.date.desc()).all()
    total_transactions = len(all_transactions)
    transactions = [t for t in all_transactions if t.type == "income"]
    total_income = sum(t.amount for t in transactions)
    total_expenses = get_expense_total(current_user.user_id)
    balance = total_income - total_expenses

    if request.method == 'POST':
        data = request.get_json()
        profile_data = {
            'first_name': data.get('firstName'),
            'last_name': data.get('lastName'),
            'phone': data.get('phone'),
            'street': data.get('street'),
            'city': data.get('city'),
            'zip_code': data.get('zipCode'),
            'country': data.get('country')
        }
        
        profile = User_Profile.query.filter_by(user_id=current_user.user_id).first()
        if profile:
            for key, value in profile_data.items():
                setattr(profile, key, value)
        else:
            new_profile = User_Profile(user_id=current_user.user_id, **profile_data)
            db.session.add(new_profile)
        
        db.session.commit()
        return jsonify(success=True)
    
    profile_data = None
    profile = User_Profile.query.filter_by(user_id=current_user.user_id).first()
    if profile:
        profile_data = {
            'firstName': profile.first_name,
            'lastName': profile.last_name,
            'phone': profile.phone,
            'street': profile.street,
            'city': profile.city,
            'zipCode': profile.zip_code,
            'country': profile.country
        }
    else:
        profile_data = {
            'firstName': current_user.username,
            'lastName': '',
            'phone': '',
            'street': '',
            'city': '',
            'zipCode': '',
            'country': 'United States'
        }
    
    return render_template('profile.html', total_transactions=total_transactions, balance=balance, profile_data=profile_data)

@main_bp.route('/reports')
@login_required
def reports():
    try:
        transactions = Transaction.query.filter_by(user_id=current_user.user_id).order_by(Transaction.date.desc()).all()
        
        total_income = sum(t.amount for t in transactions if t.type == 'income')
        total_expenses = sum(t.amount for t in transactions if t.type == 'expense')
        savings_goals = Savings_Goals.query.filter_by(user_id=current_user.user_id).all()
        total_savings = sum(s.currentamount for s in savings_goals) if savings_goals else 0
        net_worth = total_income - total_expenses + total_savings
        
        monthly_data = get_monthly_data(transactions)
        category_data = get_category_data(transactions)
        net_worth_data = get_net_worth_data(current_user.user_id, transactions, savings_goals)
        cash_flow_data = get_cash_flow_data(transactions)
        
        return render_template(
            'reports.html',
            total_income=total_income,
            total_expenses=total_expenses,
            total_savings=total_savings,
            net_worth=net_worth,
            transactions=transactions[-10:],
            monthly_data=json.dumps(monthly_data),
            category_data=json.dumps(category_data),
            net_worth_data=json.dumps(net_worth_data),
            cash_flow_data=json.dumps(cash_flow_data)
        )
    except Exception as e:
        return render_template('error.html', error=str(e)), 500

@main_bp.route('/income')
@login_required
def income_dashboard():
    income_transactions = Transaction.query.filter(
        Transaction.user_id == current_user.user_id,
        Transaction.type == 'income'
    ).all()
    
    total_income = sum(t.amount for t in income_transactions)
    
    sources = defaultdict(float)
    for t in income_transactions:
        sources[t.category] += t.amount
    primary_source = max(sources.items(), key=lambda x: x[1])[0] if sources else "No data"
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_income = [t.amount for t in income_transactions if t.date >= thirty_days_ago]
    avg_daily_income = sum(recent_income) / 30 if recent_income else 0
    
    recent_transactions = Transaction.query.filter(
        Transaction.user_id == current_user.user_id,
        Transaction.type == 'income'
    ).order_by(Transaction.date.desc()).limit(10).all()
    
    return render_template('income.html',
                         total_income=total_income,
                         primary_source=primary_source,
                         avg_daily_income=avg_daily_income,
                         transactions=recent_transactions)

@main_bp.route('/savings')
@login_required
def savings():
    return render_template('savings.html')

@main_bp.route('/settings')
@login_required
def settings():
    profile = User_Profile.query.filter_by(user_id=current_user.user_id).first()
    if profile:
        profile_data = {
            'firstName': profile.first_name,
            'lastName': profile.last_name,
            'phone': profile.phone,
        }
    else:
        profile_data = {
            'firstName': current_user.username,
            'lastName': '',
            'phone': '',
        }
    return render_template('settings.html', profile_data=profile_data)

@main_bp.route('/transaction')
@login_required
def transaction():
    transactions = Transaction.query.filter_by(user_id=current_user.user_id, type="income").order_by(Transaction.date.desc()).all()
    total_income = sum(transaction.amount for transaction in transactions)
    total_expenses = get_expense_total(current_user.user_id)
    user_transactions = Transaction.query.filter_by(user_id=current_user.user_id).all()
    net_balance = total_income - total_expenses
    
    transactions_data = []
    for t in user_transactions:
        transactions_data.append({
            'id': t.id,
            'date': t.date.strftime('%Y-%m-%d %H:%M'),
            'category': t.category,
            'description': t.description,
            'amount': float(t.amount),
            'payment_method': t.payment_method,
            'status': t.status
        })
    return render_template('transactions.html', total_income=total_income, transactions=transactions_data, total_expenses=total_expenses, net_balance=net_balance)
