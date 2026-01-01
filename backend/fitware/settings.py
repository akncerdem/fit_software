import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url
from datetime import timedelta
import warnings

# Suppress urllib3 warnings
warnings.filterwarnings('ignore', message='urllib3 v2 only supports OpenSSL 1.1.1+')

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-change-me")
DEBUG = os.getenv("DEBUG", "False") == "True"

# --- HOSTS ---
ALLOWED_HOSTS = [
    'fitware.com.tr', 
    'www.fitware.com.tr', 
    '35.198.170.119', 
    'localhost', 
    '127.0.0.1'
]

# --- APPS ---
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "rest_framework.authtoken",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    
    # Your apps
    'fitware',
    'exercises',
    'workouts',
]

SITE_ID = 1
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware", # En üstte olmalı
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
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

# --- DATABASE ---
# dj_database_url otomatik olarak DATABASE_URL'i parse eder
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# --- AUTH & PASSWORD ---
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- ALLAUTH SETTINGS ---
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = 'optional'

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
        'APP': {
            'client_id': os.getenv('GOOGLE_CLIENT_ID'),
            'secret': os.getenv('GOOGLE_CLIENT_SECRET'),
            'key': ''
        }
    }
}

# --- INTERNATIONALIZATION ---
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Europe/Istanbul"
USE_I18N = True
USE_TZ = True

# --- STATIC & MEDIA ---
STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- REST FRAMEWORK ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
       # "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# --- CORS & CSRF & SECURITY (CRITICAL FIXES) ---

# HTTPS Ayarları (Nginx arkasında olduğunuz için)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True

# React'in Cookie okuyabilmesi için (Google Login ve Upload hatasını çözer):
CSRF_COOKIE_HTTPONLY = False 

# CORS (Frontend'den gelen isteklere izin ver)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "https://fitware.com.tr",
    "https://www.fitware.com.tr",
    "http://localhost:5173", # Dev ortamı
    "http://localhost:3000",
]

# CSRF (Güvenilir domainler - HTTPS zorunlu)
CSRF_TRUSTED_ORIGINS = [
    'https://fitware.com.tr',
    'https://www.fitware.com.tr',
    'http://localhost:5173',
]

# --- GOOGLE OAUTH ---
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://fitware.com.tr/api/auth/google/callback/")
GOOGLE_FRONTEND_REDIRECT = os.getenv("GOOGLE_FRONTEND_REDIRECT", "https://fitware.com.tr/google-callback")

# --- EMAIL ---
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://fitware.com.tr")
