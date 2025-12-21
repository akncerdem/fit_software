import os
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse
from decouple import config
import warnings
import dj_database_url

# Suppress urllib3 warnings about LibreSSL
warnings.filterwarnings('ignore', message='urllib3 v2 only supports OpenSSL 1.1.1+')

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
     "rest_framework_simplejwt.token_blacklist", # refresh rotation/iptal için
    # Third-party
    "rest_framework",
    "corsheaders",
     # Auth
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    'rest_framework.authtoken',

    "dj_rest_auth",
    "dj_rest_auth.registration",
     # Your apps
    'fitware',
    'exercises',
    'workouts',
]
SITE_ID = 1


SOCIALACCOUNT_PROVIDERS = {
        'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        "APP": {
            "client_id": config('GOOGLE_CLIENT_ID'),
            "secret": config('GOOGLE_CLIENT_SECRET'),
            "key": ""
        },
        "SCOPE": ["email", "profile"],
    }
}
# Allauth ayarları
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = 'optional'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev
    "http://localhost:3000",  # CRA (if you use it)
]
CSRF_TRUSTED_ORIGINS = ["http://localhost:8000"]
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
     'allauth.account.middleware.AccountMiddleware',
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
        'default': dj_database_url.config(
            # Replace this string with the one you copied from Neon
            default='postgresql://neondb_owner:npg_NtHduUS6w2LD@ep-billowing-brook-ahh4cpxc-pooler.c-3.us-east-1.aws.neon.tech/Db?sslmode=require&channel_binding=require',
            conn_max_age=600
        )
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
        'rest_framework.authentication.TokenAuthentication',
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
}


from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}


# CORS
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Google OAuth settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:8000/api/auth/google/callback/",
)
GOOGLE_FRONTEND_REDIRECT = os.getenv(
    "GOOGLE_FRONTEND_REDIRECT",
    "http://localhost:5173/google-callback",
)




# --- Password reset email (DEV) ---
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
