# Easy Budget (Presupuesto_facil)

A modern web application for personal budget management with real-time banking integration. Inspired by YNAB (You Need A Budget), it allows users to connect their bank accounts and effectively manage their budget through an intuitive interface.

This project is still in development.
   
         Authentication [v], 
         Test data from TrueLayer [v] .
         Basic business Logic [V]
         Test with real data from Truelayer [X]
         Complex business Logic [X]

## 📸 Screenshots

### Banking Connection with TrueLayer
![TrueLayer Connection Process](./screenshots/truelayer-connect.png)
*Secure bank account connection through TrueLayer's interface*

### Dashboard Overview
![Application Accounts](./screenshots/accounts.png)
*Main dashboard showing budget categories, spending analysis, and account balances*

### Transactions Overview
![Application Transactions](./screenshots/transactions.png)
*Transactions section*

## ✨ Features

- **Secure Authentication**
  - Firebase-based authentication system
  - Protected routes and API endpoints
  - User session management

- **Banking Integration**
  - Direct bank connection through TrueLayer API
  - Real-time account balance updates
  - Automatic transaction synchronization
  - Multi-bank account support

- **Budget Management**
  - Custom category creation and grouping
  - "Ready to Assign" system for available funds
  - Expense tracking by category
  - Monthly budget planning
  - Transaction categorization
  - Spending analysis and reports

- **User Experience**
  - Responsive design for all devices
  - Intuitive sidebar navigation
  - Real-time updates
  - Dark/Light mode support

## 🚀 Technologies

### Frontend
- React 18
- React Router v6
- Firebase Authentication
- Tailwind CSS
- Context API for state management

### Backend
- FastAPI (Python)
- PostgreSQL + SQLAlchemy ORM
- Firebase Admin SDK
- TrueLayer API
- Uvicorn (ASGI server)

## 📋 Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL
- Firebase account
- TrueLayer developer account

## ⚙️ Installation

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/PitiGo/presupuesto_facil.git
cd presupuesto_facil
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Create .env file in the root directory
DATABASE_URL=postgresql://user:password@localhost/easy_budget
FIREBASE_CREDENTIALS=path/to/firebase-credentials.json
TRUELAYER_CLIENT_ID=your_client_id
TRUELAYER_CLIENT_SECRET=your_client_secret
```

5. Start the server:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Create .env file in frontend directory
REACT_APP_API_URL=http://localhost:8000
REACT_APP_FIREBASE_CONFIG={"apiKey":"...","authDomain":"..."}
```

4. Start the application:
```bash
npm start
```

## 🗂️ Project Structure

```
presupuesto_facil/
├── backend/
│   ├── app/
│   │   ├── core/           # Core functionality (Firebase, config)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API routes
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── database.py     # Database configuration
│   │   └── main.py        # Application entry point
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   ├── contexts/       # Context providers
    │   ├── services/       # API services
    │   └── App.js         # Root component
    ├── package.json
    └── README.md
```

## 🔗 API Endpoints

### Authentication
- `POST /register` - User registration
- `GET /me` - Get current user info

### Accounts
- `POST /connect-truelayer` - Initialize bank connection
- `GET /accounts` - List connected accounts
- `GET /accounts/{account_id}/transactions` - Get account transactions
- `POST /accounts/sync` - Sync all accounts
- `POST /accounts/{account_id}/sync-transactions` - Sync specific account transactions

### Budgeting
- `GET/POST /category-groups` - Category groups management
- `GET/POST /categories` - Categories management
- `GET/POST /budgets` - Budgets management
- `GET/PUT /ready-to-assign` - Available funds management
- `GET/POST/PUT /transactions` - Transactions management

## 🔒 Security

- JWT-based authentication
- Firebase security rules
- CORS protection
- Environment variables for sensitive data
- SQL injection prevention through SQLAlchemy
- Input validation using Pydantic schemas

## 📱 PWA Support

The application is PWA-ready, featuring:
- Offline functionality
- App-like experience
- Home screen installation
- Push notifications (coming soon)

## 🧪 Testing

### Backend
```bash
pytest
```

### Frontend
```bash
npm test
```

## 📦 Deployment

### Backend (Example for Ubuntu/Debian)
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install python3-pip python3-venv postgresql nginx

# Clone and setup
git clone https://github.com/PitiGo/presupuesto_facil.git
cd easy-budget
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure Gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### Frontend
```bash
# Build production version
npm run build

# Deploy to hosting service (e.g., Firebase Hosting)
firebase deploy
```

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Dante Collazzi - Initial work - [PITIGO](https://github.com/PitiGo)

## 🙏 Acknowledgments

- YNAB for inspiration
- TrueLayer for banking API
- Firebase team for authentication services