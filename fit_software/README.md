# Fitware — Starter Monorepo

This is a minimal starter for your **Django + React** fitness app.

## Structure
```
fit_software/
├─ backend/              # Django API (Django REST Framework)
│  ├─ manage.py
│  └─ fitware/           # Django project
│     ├─ settings.py
│     ├─ urls.py
│     ├─ asgi.py
│     └─ wsgi.py
├─ frontend/             # React (Vite)
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.js
│  └─ src/
│     ├─ main.jsx
│     ├─ App.jsx
│     └─ index.css
├─ .gitignore
├─ LICENSE
└─ README.md
```

## Quickstart

# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process


### 1) Backend (Django API)
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env  # then update values if needed
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

- Health endpoint: http://localhost:8000/api/health/
- Admin (after creating superuser): http://localhost:8000/admin/

### 2) Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev   # starts on http://localhost:5173
```

### 3) First push to GitHub
```bash
git init
git branch -M main
git remote add origin https://github.com/akncerdem/fit_software.git
git add .
git commit -m "chore: project bootstrap (Django + React + DRF + Vite)"
git push -u origin main
```

### 4) Environment

- **Backend** uses environment variables from `.env`:
  - `SECRET_KEY`: a long random string (dev default is fine).
  - `DEBUG`: `True` / `False`.
  - `DATABASE_URL`: e.g. `postgres://USER:PASS@localhost:5432/fitware` (if empty, SQLite is used).
  - `CORS_ALLOW_ALL`: `True` (dev) or `False` and configure `CORS_ALLOWED_ORIGINS`.

- **Frontend** reads API base URL from `src/config.js` (`VITE_API_BASE` also supported).

> Postgres can be added later via Docker or local install. This starter defaults to SQLite for development to keep setup fast.