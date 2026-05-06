# Finance Management System

A comprehensive, production-ready Finance Management System built with Python Flask. This application helps users track their income, expenses, and savings goals, providing insightful reports and visual dashboards.

## Features

- **User Authentication**: Secure login, signup, and session management using `Flask-Login` and `Werkzeug` security.
- **Interactive Dashboard**: Visual representation of spending, income vs expenses, and savings.
- **Income & Expense Tracking**: Categorize and log financial transactions.
- **Savings Goals**: Set up goals, target amounts, and track progress over time.
- **Data Visualization**: Dynamic charts representing cash flow and net worth.
- **Export Functionality**: Export transactions to CSV or PDF for personal records.

## Tech Stack

- **Backend**: Python, Flask, Flask-SQLAlchemy, Flask-Login
- **Database**: MySQL (via PyMySQL)
- **Frontend**: HTML5, CSS3, JavaScript, Chart.js (or similar charting library)
- **Other**: ReportLab (PDF generation), PyPDF2, Flask-CORS

## Project Architecture & Folder Structure

The project follows a modular, scalable architecture standard for Flask applications:

```
Finance-Managment-system/
├── app/                      # Application package
│   ├── __init__.py           # Application factory and extensions
│   ├── models.py             # SQLAlchemy database models
│   ├── utils.py              # Helper functions and template filters
│   ├── routes/               # Blueprints for different modules
│   │   ├── auth.py           # Authentication routes
│   │   ├── main.py           # Core views (dashboard, profile)
│   │   └── api.py            # API and export endpoints
│   ├── static/               # CSS, JavaScript, and image files
│   └── templates/            # HTML templates
├── run.py                    # Application entry point
├── config.py                 # Configuration settings (Dev, Prod, Test)
├── requirements.txt          # Python dependencies
├── .env.sample               # Template for environment variables
└── README.md                 # Project documentation
```

## Setup and Installation

### 1. Clone the Repository
```bash
git clone https://github.com/ChariteshReddyPatlolla/Finance-Managment-system.git
cd Finance-Managment-system
```

### 2. Create a Virtual Environment
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Variables
Copy the `.env.sample` file to `.env` and configure your database URI and Secret Key.
```bash
cp .env.sample .env
```
Ensure your MySQL server is running and the database specified in `.env` is created.

### 5. Run the Application
```bash
python run.py
```
The application will be accessible at `http://localhost:5000`.

## Database Setup

The application is configured to use MySQL. If you prefer to use SQLite for development, change the `SQLALCHEMY_DATABASE_URI` in `.env` to:
`sqlite:///project.db`

The database tables will be automatically created upon the first run of the application if they do not exist.

## Screenshots

*(Add screenshots of your application here)*
- **Dashboard View**: `![Dashboard](path/to/image)`
- **Reports View**: `![Reports](path/to/image)`

## Future Improvements

- Add support for multiple currencies
- Integrate with banking APIs for automatic transaction syncing
- Implement email notifications for savings goals and budget limits

## License

This project is open-source and available under the MIT License.