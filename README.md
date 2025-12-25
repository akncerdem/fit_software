# 💪 Fitware — Fitness Tracking Application

A full-stack fitness tracking application built with **Django REST Framework** and **React (Vite)**. Track your workouts, set goals, join challenges, and earn badges!

![Django](https://img.shields.io/badge/Django-4.2-green?logo=django)
![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![Python](https://img.shields.io/badge/Python-3.x-yellow?logo=python)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-django-api)
  - [Frontend Setup](#2-frontend-react--vite)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Environment Variables](#-environment-variables)
- [License](#-license)

---

## ✨ Features

- **🔐 Authentication**
  - Email/Password login & signup
  - Google OAuth integration
  - JWT token-based authentication
  - Password reset via email

- **🏋️ Workouts**
  - Create and manage workout sessions
  - Browse exercise library
  - Track workout history

- **🎯 Goals**
  - Set personal fitness goals
  - Track progress with activity logs
  - Multiple goal types (steps, calories, distance, etc.)

- **🏆 Challenges**
  - Join community challenges
  - Compete with other users
  - Track challenge progress

- **🥇 Badges**
  - Earn badges for achievements
  - Track your accomplishments
  - Gamified fitness experience

- **👤 Profile**
  - Customizable user profile
  - Profile picture upload
  - View personal statistics

---

## 🛠 Tech Stack

### Backend
| Technology | Description |
|------------|-------------|
| Django 4.2 | Python web framework |
| Django REST Framework | RESTful API |
| SimpleJWT | JWT authentication |
| PostgreSQL / SQLite | Database |
| django-allauth | Social authentication |
| Pillow | Image processing |

### Frontend
| Technology | Description |
|------------|-------------|
| React 18 | UI library |
| Vite | Build tool |
| React Router | Client-side routing |
| Axios | HTTP client |
| Vitest | Unit testing |
| Cypress | E2E testing |

---

## 📁 Project Structure

```
fit_software/
├─ backend/                    # Django API
│  ├─ manage.py
│  ├─ requirements.txt
│  ├─ fitware/                 # Main Django project
│  │  ├─ settings.py
│  │  ├─ urls.py
│  │  ├─ authentication.py
│  │  ├─ goals.py              # Goals & Activity tracking
│  │  ├─ challanges.py         # Challenges system
│  │  ├─ badges.py             # Badge system
│  │  ├─ profile.py            # User profiles
│  │  └─ tests/                # Backend tests
│  ├─ exercises/               # Exercise library app
│  ├─ workouts/                # Workout tracking app
│  └─ media/                   # Uploaded files
│
├─ frontend/                   # React (Vite)
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ cypress/                 # E2E tests
│  └─ src/
│     ├─ main.jsx
│     ├─ App.jsx
│     ├─ api.js                # API client
│     ├─ login.jsx
│     ├─ signup.jsx
│     ├─ profile.jsx
│     ├─ workout.jsx
│     ├─ goal.jsx
│     ├─ challenges.jsx
│     └─ __tests__/            # Unit tests
│
├─ LICENSE
└─ README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **npm** or **yarn**
- **Git**

> **Windows Users:** Run this command first if you encounter execution policy issues:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
> ```

---

### 1) Backend (Django API)

```bash
# Navigate to backend directory
cd fit_software/backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser

# Start the development server
python manage.py runserver 0.0.0.0:8000
```

**Backend URLs:**
- 🏥 Health Check: http://localhost:8000/api/health/
- 🔧 Admin Panel: http://localhost:8000/admin/
- 📚 API Root: http://localhost:8000/api/

### 2) Frontend (React + Vite)

```bash
# Navigate to frontend directory
cd fit_software/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend URL:** http://localhost:5173

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login/` | User login |
| POST | `/api/v1/auth/signup/` | User registration |
| POST | `/api/v1/auth/token/` | Obtain JWT token |
| POST | `/api/v1/auth/refresh/` | Refresh JWT token |
| GET | `/api/auth/google/login/` | Google OAuth login |
| POST | `/api/v1/auth/password/reset/` | Request password reset |
| POST | `/api/v1/auth/password/reset/confirm/` | Confirm password reset |

### Goals & Activities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals/` | List user goals |
| POST | `/api/goals/` | Create a new goal |
| GET | `/api/goals/{id}/` | Get goal details |
| PUT | `/api/goals/{id}/` | Update a goal |
| DELETE | `/api/goals/{id}/` | Delete a goal |

### Challenges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/challenges/` | List all challenges |
| POST | `/api/challenges/` | Create a challenge |
| POST | `/api/challenges/{id}/join/` | Join a challenge |
| GET | `/api/challenges/{id}/leaderboard/` | Challenge leaderboard |

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workouts/` | List user workouts |
| POST | `/api/workouts/` | Create a workout |
| GET | `/api/exercises/` | List all exercises |

### Profile & Badges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/` | Get user profile |
| PUT | `/api/profile/` | Update profile |
| GET | `/api/badges/` | List user badges |

---

## 🧪 Testing

### Backend Tests
```bash
cd fit_software/backend

# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific test file
pytest fitware/tests/test_auth.py
```

### Frontend Tests
```bash
cd fit_software/frontend

# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run E2E tests (Cypress)
npm run cypress:open

# Run E2E tests headless
npm run cypress:run
```

---

## ⚙️ Environment Variables

### Backend (.env)
```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database (leave empty for SQLite)
DATABASE_URL=postgres://USER:PASS@localhost:5432/fitware

# CORS
CORS_ALLOW_ALL=True
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Frontend (src/config.js)
```javascript
export const API_BASE = "http://localhost:8000";
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](fit_software/LICENSE) file for details.

---

## 👥 Authors

- **Fitware Team** - Initial work

---

<p align="center">
  Made with ❤️ for fitness enthusiasts
</p>
