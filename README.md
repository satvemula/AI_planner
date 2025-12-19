# Planner Winter

AI-powered task planner with intelligent duration estimation and calendar scheduling.

## Features

- 🤖 **AI Duration Estimation** - Automatically estimates task duration using OpenAI
- 📅 **Calendar View** - Drag-and-drop scheduling with time slots
- ✅ **Task Management** - Create, update, and organize tasks by category and priority
- 🔐 **Secure Authentication** - JWT-based authentication with secure storage
- 📱 **Mobile App** - Native iOS and Android apps built with Capacitor
- 🎨 **Modern UI** - Beautiful, responsive design

## Tech Stack

### Frontend
- Vanilla JavaScript (ES6 modules)
- HTML5 & CSS3
- Capacitor (for mobile apps)

### Backend
- FastAPI (Python)
- SQLAlchemy (async)
- PostgreSQL / SQLite
- OpenAI API integration

## Getting Started

### Prerequisites

- Node.js 16+
- Python 3.9+
- PostgreSQL (for production) or SQLite (for development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run migrations (if using Alembic)
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Mobile App Setup

See [MOBILE_SETUP.md](./MOBILE_SETUP.md) for detailed instructions on building for iOS and Android.

## Project Structure

```
.
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── models.py # Database models
│   │   ├── services/ # Business logic
│   │   └── main.py   # FastAPI app
│   └── requirements.txt
├── js/               # Frontend JavaScript
│   ├── app.js        # Main application logic
│   ├── api.js        # API client
│   ├── auth.js       # Authentication
│   ├── calendar.js   # Calendar functionality
│   ├── modal.js      # Task creation modal
│   └── mobile.js     # Mobile-specific features
├── css/              # Stylesheets
├── index.html        # Main HTML file
├── capacitor.config.ts # Capacitor configuration
└── package.json      # Node.js dependencies
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Tasks
- `GET /api/v1/tasks` - List tasks (with filters)
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks/{id}` - Get task
- `PATCH /api/v1/tasks/{id}` - Update task
- `DELETE /api/v1/tasks/{id}` - Delete task
- `POST /api/v1/tasks/{id}/schedule` - Schedule task
- `DELETE /api/v1/tasks/{id}/schedule` - Unschedule task
- `POST /api/v1/tasks/estimate-duration` - Estimate duration

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=sqlite+aiosqlite:///./planner.db
JWT_SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-api-key
FRONTEND_URL=http://localhost:8080
```

## Deployment

### Backend

Deploy to:
- Heroku
- Railway
- AWS
- DigitalOcean
- Render

### Frontend/Mobile

1. Build the web app
2. Sync with Capacitor: `npm run cap:sync`
3. Build native apps in Xcode (iOS) or Android Studio (Android)
4. Submit to App Store / Play Store

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend - manual testing in browser
npm run dev
```

### Code Style

- Python: Follow PEP 8
- JavaScript: ES6+ with modules
- Use async/await for async operations

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.


