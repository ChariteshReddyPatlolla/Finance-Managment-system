from flask import Blueprint, request, jsonify, make_response
from flask_login import login_required, current_user
from datetime import datetime, timedelta
from app.models import Transaction, Savings_Goals, SavingTransaction, User
from app import db
from collections import defaultdict
import csv
from io import StringIO, BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from app.utils import get_monthly_data, get_category_data, get_net_worth_data, get_cash_flow_data, calculate_total_income, calculate_total_expenses, calculate_net_worth

api_bp = Blueprint('api', __name__)

@api_bp.route('/dashboard/data')
@login_required
def dashboard_data():
    period = request.args.get('period', 'month')
    try:
        end_date = datetime.now()
        if period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)
        
        transactions = Transaction.query.filter(
            Transaction.user_id == current_user.user_id,
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).all()
        
        spending_data = defaultdict(lambda: {'income': 0, 'expense': 0})
        for t in transactions:
            if period == 'week':
                key = t.date.strftime('%a')
            elif period == 'year':
                key = t.date.strftime('%b')
            else:
                key = f"Week {t.date.isocalendar()[1] - end_date.isocalendar()[1] + 4}"
            
            spending_data[key][t.type] += t.amount
        
        if period == 'week':
            days_order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            sorted_keys = [day for day in days_order if day in spending_data]
        elif period == 'year':
            month_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            sorted_keys = [month for month in month_order if month in spending_data]
        else:
            sorted_keys = sorted(spending_data.keys(), key=lambda x: int(x.split(' ')[1]) if len(x.split(' '))>1 else 0)
        
        expense_categories = defaultdict(float)
        for t in transactions:
            if t.type == 'expense':
                expense_categories[t.category] += t.amount
        
        return jsonify({
            'spending': {
                'labels': sorted_keys,
                'income': [spending_data[key]['income'] for key in sorted_keys],
                'expenses': [spending_data[key]['expense'] for key in sorted_keys]
            },
            'expense_dist': {
                'labels': list(expense_categories.keys()),
                'values': list(expense_categories.values())
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/income/sources')
@login_required
def income_sources_data():
    try:
        income_transactions = Transaction.query.filter(
            Transaction.user_id == current_user.user_id,
            Transaction.type == 'income'
        ).all()
        
        sources_data = defaultdict(float)
        for transaction in income_transactions:
            sources_data[transaction.category] += transaction.amount
        
        result = [{'name': category, 'value': amount} for category, amount in sources_data.items()]
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/income/trend')
@login_required
def income_trend_data():
    time_filter = request.args.get('filter', 'yearly')
    end_date = datetime.utcnow()
    
    if time_filter == 'monthly':
        start_date = end_date - timedelta(days=30)
        group_format = '%Y-%m-%d'
        label_format = '%b %d'
    elif time_filter == 'quarterly':
        start_date = end_date - timedelta(days=90)
        group_format = '%Y-%W'
        label_format = 'Week %W'
    else:
        start_date = end_date - timedelta(days=365)
        group_format = '%Y-%m'
        label_format = '%b %Y'
    
    income_transactions = Transaction.query.filter(
        Transaction.user_id == current_user.user_id,
        Transaction.type == 'income',
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).order_by(Transaction.date).all()
    
    grouped_data = defaultdict(float)
    for transaction in income_transactions:
        if time_filter == 'monthly':
            key = transaction.date.strftime(group_format)
            label = transaction.date.strftime(label_format)
        elif time_filter == 'quarterly':
            week_num = transaction.date.isocalendar()[1]
            year = transaction.date.year
            key = f"{year}-{week_num}"
            label = f"Week {week_num}"
        else:
            key = transaction.date.strftime(group_format)
            label = transaction.date.strftime(label_format)
        
        grouped_data[key] += transaction.amount
    
    result = []
    if time_filter == 'monthly':
        for i in range(30):
            date = end_date - timedelta(days=i)
            key = date.strftime(group_format)
            label = date.strftime(label_format)
            result.append({'date': label, 'amount': grouped_data.get(key, 0)})
        result.reverse()
    elif time_filter == 'quarterly':
        for i in range(12):
            date = end_date - timedelta(weeks=i)
            week_num = date.isocalendar()[1]
            year = date.year
            key = f"{year}-{week_num}"
            label = f"Week {week_num}"
            result.append({'date': label, 'amount': grouped_data.get(key, 0)})
        result.reverse()
    else:
        current = start_date
        while current <= end_date:
            key = current.strftime(group_format)
            label = current.strftime(label_format)
            result.append({'date': label, 'amount': grouped_data.get(key, 0)})
            if current.month == 12:
                current = current.replace(year=current.year+1, month=1)
            else:
                current = current.replace(month=current.month+1)
    
    return jsonify({
        'success': True,
        'data': result,
        'filter': time_filter,
        'timeframe': {'start': start_date.strftime('%Y-%m-%d'), 'end': end_date.strftime('%Y-%m-%d')}
    })

@api_bp.route('/reports/data')
@login_required
def reports_data():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    try:
        transactions = Transaction.query.filter(
            Transaction.user_id == current_user.user_id,
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).all()
        
        monthly_data = get_monthly_data(transactions)
        category_data = get_category_data(transactions)
        savings_goals = Savings_Goals.query.filter_by(user_id=current_user.user_id).all()
        net_worth_data = get_net_worth_data(current_user.user_id, transactions, savings_goals)
        cash_flow_data = get_cash_flow_data(transactions)
        
        total_income = sum(monthly_data['income'])
        total_expenses = sum(monthly_data['expenses'])
        total_savings = sum(s.currentamount for s in savings_goals) if savings_goals else 0
        
        return jsonify({
            'monthly_data': monthly_data,
            'category_data': category_data,
            'net_worth_data': net_worth_data,
            'cash_flow_data': cash_flow_data,
            'totals': {'income': total_income, 'expenses': total_expenses, 'savings': total_savings}
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/savings-goals', methods=['GET', 'POST'])
@login_required
def manage_savings_goals():
    if request.method == 'GET':
        goals = Savings_Goals.query.filter_by(user_id=current_user.user_id).all()
        return jsonify([{
            'id': goal.goal_id,
            'name': goal.goalname,
            'targetAmount': float(goal.targetamount),
            'currentAmount': float(goal.currentamount),
            'deadline': goal.deadline.strftime('%Y-%m-%d'),
            'priority': goal.priority,
            'description': goal.notes,
            'createdAt': goal.startdate.strftime('%Y-%m-%d'),
            'completed': goal.currentamount >= goal.targetamount
        } for goal in goals])
    
    if request.method == 'POST':
        data = request.get_json()
        required_fields = ['name', 'targetAmount', 'deadline', 'priority']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400

        try:
            deadline = datetime.strptime(data['deadline'], '%Y-%m-%d')
            new_goal = Savings_Goals(
                user_id=current_user.user_id,
                goalname=data['name'],
                targetamount=float(data['targetAmount']),
                currentamount=float(data.get('currentAmount', 0)),
                deadline=deadline,
                priority=data['priority'],
                notes=data.get('description', '')
            )
            db.session.add(new_goal)
            db.session.commit()
            return jsonify({'message': 'Goal added successfully', 'goal': {'id': new_goal.goal_id}}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Failed to add goal', 'error': str(e)}), 500

@api_bp.route('/savings-goals/<int:goal_id>', methods=['GET', 'PUT'])
@login_required
def manage_single_goal(goal_id):
    goal = Savings_Goals.query.filter_by(goal_id=goal_id, user_id=current_user.user_id).first()
    if not goal:
        return jsonify({'message': 'Goal not found'}), 404

    if request.method == 'GET':
        return jsonify({
            'id': goal.goal_id,
            'name': goal.goalname,
            'targetAmount': float(goal.targetamount),
            'currentAmount': float(goal.currentamount),
            'deadline': goal.deadline.strftime('%Y-%m-%d'),
            'priority': goal.priority,
            'description': goal.notes
        })
        
    if request.method == 'PUT':
        data = request.get_json()
        try:
            if 'name' in data: goal.goalname = data['name']
            if 'targetAmount' in data: goal.targetamount = float(data['targetAmount'])
            if 'priority' in data: goal.priority = data['priority']
            if 'description' in data: goal.notes = data['description']
            if 'deadline' in data: goal.deadline = datetime.strptime(data['deadline'], '%Y-%m-%d')
            db.session.commit()
            return jsonify({'message': 'Goal updated successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Failed to update goal', 'error': str(e)}), 500

@api_bp.route('/savings-goals/<int:goal_id>/transactions', methods=['GET', 'POST'])
@login_required
def manage_goal_transactions(goal_id):
    goal = Savings_Goals.query.filter_by(goal_id=goal_id, user_id=current_user.user_id).first()
    if not goal:
        return jsonify({'message': 'Goal not found'}), 404

    if request.method == 'GET':
        transactions = SavingTransaction.query.filter_by(goal_id=goal_id, user_id=current_user.user_id).order_by(SavingTransaction.date.desc()).all()
        return jsonify([{
            'id': t.transaction_id,
            'amount': float(t.amount),
            'type': 'deposit' if t.amount >= 0 else 'withdrawal',
            'date': t.date.strftime('%Y-%m-%d'),
            'note': t.note,
            'goalId': goal_id
        } for t in transactions])
        
    if request.method == 'POST':
        data = request.get_json()
        try:
            amount = float(data['amount'])
            transaction_date = datetime.strptime(data['date'], '%Y-%m-%d')
            transaction_type = data['type'].lower()
            
            if transaction_type == 'withdrawal' and goal.currentamount < amount:
                return jsonify({'message': 'Insufficient funds'}), 400

            new_transaction = SavingTransaction(
                goal_id=goal_id, user_id=current_user.user_id,
                amount=amount, date=transaction_date, note=data.get('note', '')
            )
            
            if transaction_type == 'deposit': goal.currentamount += amount
            else: goal.currentamount -= amount
                
            db.session.add(new_transaction)
            db.session.commit()
            return jsonify({'message': 'Transaction added successfully'}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Failed to add transaction', 'error': str(e)}), 500

@api_bp.route('/savings-transactions', methods=['GET'])
@login_required
def get_all_savings_transactions():
    try:
        transactions = SavingTransaction.query.filter_by(user_id=current_user.user_id).order_by(SavingTransaction.date.desc()).all()
        return jsonify([{
            'id': t.transaction_id, 'amount': float(t.amount),
            'type': 'deposit' if t.amount >= 0 else 'withdrawal',
            'date': t.date.strftime('%Y-%m-%d') if t.date else None,
            'note': t.note, 'goalId': t.goal_id,
            'goalName': t.goal.goalname if t.goal else 'Deleted Goal'
        } for t in transactions])
    except Exception as e:
        return jsonify({'message': 'Failed to get transactions', 'error': str(e)}), 500

@api_bp.route('/transactions', methods=['POST'])
@login_required
def create_transaction():
    try:
        data = request.get_json()
        transaction = Transaction(
            amount=data['amount'], type=data['type'], category=data['category'],
            payment_method=data['payment_method'], description=data.get('description'),
            date=datetime.strptime(data['date'], '%Y-%m-%d'),
            status=data.get('status', 'completed'), user_id=current_user.user_id
        )
        db.session.add(transaction)
        db.session.commit()
        return jsonify({'message': 'Transaction created successfully'}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@api_bp.route('/transactions/<int:id>', methods=['DELETE'])
@login_required
def delete_transaction(id):
    transaction = Transaction.query.filter_by(id=id, user_id=current_user.user_id).first()
    if not transaction: return jsonify({'message': 'transaction not found'}), 404
    try:
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({'message': 'transaction deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@api_bp.route('/transactions/spending-by-category')
@login_required
def spending_by_category():
    expenses = Transaction.query.filter(Transaction.user_id == current_user.user_id, Transaction.type == 'expense').all()
    category_totals = defaultdict(float)
    for expense in expenses: category_totals[expense.category] += expense.amount
    return jsonify({"success": True, "data": [{"category": cat, "amount": amt} for cat, amt in category_totals.items()]})

@api_bp.route('/transactions/monthly-trends')
@login_required
def monthly_trends():
    months = int(request.args.get('months', 6))
    if months not in [3, 6, 12]: months = 6
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30*months)
    transactions = Transaction.query.filter(Transaction.user_id == current_user.user_id, Transaction.date >= start_date, Transaction.date <= end_date).all()
    
    monthly_data = {}
    current = start_date
    while current <= end_date:
        month_key = current.strftime("%b %Y")
        monthly_data[month_key] = {"income": 0, "expense": 0}
        if current.month == 12: current = current.replace(year=current.year+1, month=1)
        else: current = current.replace(month=current.month+1)
            
    for txn in transactions:
        month_key = txn.date.strftime("%b %Y")
        if month_key in monthly_data: monthly_data[month_key][txn.type] += txn.amount
            
    sorted_months = sorted(monthly_data.keys(), key=lambda x: datetime.strptime(x, "%b %Y"))
    return jsonify({"success": True, "data": [{"month": m, "income": monthly_data[m]["income"], "expense": monthly_data[m]["expense"]} for m in sorted_months]})

@api_bp.route('/categories', methods=['GET'])
@login_required
def get_categories():
    return jsonify([])

@api_bp.route('/payment-methods', methods=['GET'])
@login_required
def get_payment_methods():
    return jsonify([])

# Exports
@api_bp.route('/export/transactions/csv')
@login_required
def export_transactions_csv():
    transactions = Transaction.query.filter_by(user_id=current_user.user_id).order_by(Transaction.date.desc()).all()
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Date', 'Description', 'Category', 'Type', 'Payment Method', 'Amount', 'Status'])
    for transaction in transactions:
        cw.writerow([transaction.date.strftime('%Y-%m-%d'), transaction.description, transaction.category, transaction.type, transaction.payment_method, transaction.amount, transaction.status])
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=transactions_export.csv"
    output.headers["Content-type"] = "text/csv"
    return output

@api_bp.route('/export/reports/csv')
@login_required
def export_reports_csv():
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Financial Summary Report'])
    cw.writerow(['Generated on', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    cw.writerow(['User', current_user.username])
    cw.writerow([])
    cw.writerow(['Metric', 'Amount'])
    cw.writerow(['Total Income', f"₹{calculate_total_income(current_user.user_id)}"])
    cw.writerow(['Total Expenses', f"₹{calculate_total_expenses(current_user.user_id)}"])
    cw.writerow(['Net Worth', f"₹{calculate_net_worth(current_user.user_id)}"])
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=financial_report.csv"
    output.headers["Content-type"] = "text/csv"
    return output

@api_bp.route('/export/reports/pdf')
@login_required
def export_reports_pdf():
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    elements.append(Paragraph("Financial Report", styles['Title']))
    summary_data = [
        ['Metric', 'Amount'],
        ['Total Income', f"₹{calculate_total_income(current_user.user_id)}"],
        ['Total Expenses', f"₹{calculate_total_expenses(current_user.user_id)}"],
        ['Net Worth', f"₹{calculate_net_worth(current_user.user_id)}"]
    ]
    summary_table = Table(summary_data)
    elements.append(summary_table)
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    response = make_response(pdf)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=financial_report.pdf'
    return response
