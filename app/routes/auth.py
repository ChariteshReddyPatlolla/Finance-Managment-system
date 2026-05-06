from flask import Blueprint, render_template, request, jsonify, redirect, url_for
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import User
from app import db
from flask_cors import cross_origin

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/')
def home():
    return redirect(url_for('auth.signup'))

@auth_bp.route('/login', methods=['GET'])
@auth_bp.route('/index')
def login():
    return render_template('index.html')

@auth_bp.route('/signup', methods=['GET'])
def signup():
    return render_template('signup.html')

@auth_bp.route('/forgot-password')
def forgot_password():
    return render_template('forgot-password.html')

@auth_bp.route('/api/auth/login', methods=['POST'])
def handle_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()

        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({'message': 'Invalid email or password'}), 401

        login_user(user)
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.user_id,
                'name': user.username,
                'email': user.email
            },
            'redirect': url_for('main.dashboard')
        }), 200

    except Exception as e:
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/api/auth/register', methods=['POST'])
def handle_registration():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        required_fields = ['name', 'email', 'password', 'confirmPassword']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'All fields are required'}), 400

        name = data['name'].strip()
        email = data['email'].strip().lower()
        password = data['password'].strip()
        confirm_password = data['confirmPassword'].strip()

        if not all([name, email, password, confirm_password]):
            return jsonify({'message': 'Fields cannot be empty'}), 400

        if password != confirm_password:
            return jsonify({'message': 'Passwords do not match'}), 400

        if len(password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Email already registered'}), 409

        new_user = User(username=name, email=email)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'message': 'Registration successful! Please login to continue.',
            'user': {
                    'id': new_user.user_id,
                    'name': new_user.username,
                    'email': new_user.email
                    }
            }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/api/auth/logout', methods=['POST'])
@login_required
def handle_logout():
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json()
    current_pw = data.get('current_password')
    new_pw = data.get('new_password')
    confirm_pw = data.get('confirm_password')

    if not all([current_pw, new_pw, confirm_pw]):
        return jsonify({'success': False, 'message': 'All fields are required'}), 400

    if new_pw != confirm_pw:
        return jsonify({'success': False, 'message': 'New passwords do not match'}), 400

    if not current_user.check_password(current_pw):
        return jsonify({'success': False, 'message': 'Current password is incorrect'}), 400

    try:
        current_user.set_password(new_pw)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Password updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Error updating password'}), 500
    
@auth_bp.route('/delete-account', methods=['DELETE'])
@cross_origin(supports_credentials=True, origins=["http://localhost:3000"])
@login_required
def delete_account():
    try:
        data = request.get_json()
        password = data.get('password', '').strip()

        if not password:
            return jsonify({'success': False, 'message': 'Password is required'}), 400

        if not current_user.check_password(password):
            return jsonify({'success': False, 'message': 'Incorrect password'}), 401

        db.session.delete(current_user)
        db.session.commit()
        logout_user()

        return jsonify({
            'success': True,
            'message': 'Account permanently deleted',
            'redirect': url_for('auth.login')
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
