import os
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-change-me")
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = ["*"] if DEBUG else os.getenv("ALLOWED_HOSTS", "").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "fitware.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "fitware.wsgi.application"
ASGI_APPLICATION = "fitware.asgi.application"

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if DATABASE_URL:
    # Very simple parser; for production use dj-database-url instead.
    parsed = urlparse(DATABASE_URL)
    ENGINE = "django.db.backends.postgresql"
    NAME = parsed.path.lstrip("/")
    USER = parsed.username or ""
    PASSWORD = parsed.password or ""
    HOST = parsed.hostname or "localhost"
    PORT = parsed.port or 5432
    DATABASES = {
        "default": {
            "ENGINE": ENGINE,
            "NAME": NAME,
            "USER": USER,
            "PASSWORD": PASSWORD,
            "HOST": HOST,
            "PORT": PORT,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Europe/Istanbul"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
}

# CORS
CORS_ALLOW_ALL = os.getenv("CORS_ALLOW_ALL", "True") == "True"
if not CORS_ALLOW_ALL:
    allowed = os.getenv("CORS_ALLOWED_ORIGINS", "")
    CORS_ALLOWED_ORIGINS = [s.strip() for s in allowed.split(",") if s.strip()]