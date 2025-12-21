import logging
import secrets
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import path,include
from django.core.mail import send_mail
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .goals import GoalViewSet
from .profile import ProfileViewSet
from .challanges import ChallengeViewSet
from .badges import BadgeViewSet

logger = logging.getLogger(__name__)
router = DefaultRouter()
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'profile', ProfileViewSet, basename='profile')
router.register(r"challenges", ChallengeViewSet, basename="challenge")
router.register(r'badges', BadgeViewSet, basename='badge')

def health(request):
    return JsonResponse({"status": "ok", "service": "fitware", "version": "0.1.0"})


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    try:
        from django.utils import timezone
        from .goals import ActivityLog
        
        data = request.data
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return Response(
                {"error": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(username=email, password=password)
        if not user:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Log the login activity
        try:
            today = timezone.now().date()
            ActivityLog.objects.get_or_create(
                user=user, 
                date=today, 
                defaults={'action_type': 'login'}
            )
        except Exception as log_err:
            logger.warning("Could not log activity: %s", log_err)

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_200_OK,
        )

    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Login failed: %s", exc)
        return Response(
            {"error": "Unexpected error during login."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    try:
        data = request.data
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        repeat_password = data.get("repeat_password", "")

        if not all([first_name, last_name, email, password, repeat_password]):
            return Response(
                {"error": "All fields are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if password != repeat_password:
            return Response(
                {"error": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "This email address is already registered."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=email).exists():
            return Response(
                {"error": "This email address is already registered."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Account created successfully.",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("Signup failed: %s", exc)
        return Response(
            {"error": "Unexpected error during signup."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


token_generator = PasswordResetTokenGenerator()

@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request(request):
    email = (request.data.get("email") or "").strip().lower()

    # Güvenlik: email boş/yanlış olsa bile aynı cevap
    if not email:
        return Response({"message": "If the email exists, a reset link was sent."}, status=status.HTTP_200_OK)

    user = User.objects.filter(email=email).first()

    # Email yoksa bile aynı mesaj (email enumeration engeller)
    if not user:
        return Response({"message": "If the email exists, a reset link was sent."}, status=status.HTTP_200_OK)

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = token_generator.make_token(user)

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password/{uid}/{token}"

    send_mail(
        subject="Fitware - Reset your password",
        message=(
            f"Click this link to reset your password:\n\n{reset_link}\n\n"
            "If you did not request this, ignore this email."
        ),
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@fitware.local"),
        recipient_list=[email],
        fail_silently=False,
    )

    return Response({"message": "If the email exists, a reset link was sent."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    uidb64 = (request.data.get("uid") or "").strip()
    token = (request.data.get("token") or "").strip()
    new_password = request.data.get("new_password") or ""
    repeat_password = request.data.get("repeat_password") or ""

    if not uidb64 or not token:
        return Response({"error": "Missing uid or token."}, status=status.HTTP_400_BAD_REQUEST)

    if not new_password or not repeat_password:
        return Response({"error": "New password fields are required."}, status=status.HTTP_400_BAD_REQUEST)

    if new_password != repeat_password:
        return Response({"error": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except Exception:
        return Response({"error": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

    if not token_generator.check_token(user, token):
        return Response({"error": "Reset link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save(update_fields=["password"])

    return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)


def _google_configured() -> bool:
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)


def _build_frontend_redirect(params):
    base = settings.GOOGLE_FRONTEND_REDIRECT
    if not params:
        return base
    separator = "&" if "?" in base else "?"
    return f"{base}{separator}{urlencode(params)}"


@api_view(["GET"])
@permission_classes([AllowAny])
def google_login(request):
    if not _google_configured():
        return Response(
            {"error": "Google OAuth is not configured."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    state = secrets.token_urlsafe(32)
    request.session["google_oauth_state"] = state

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return redirect(google_auth_url)


@api_view(["GET"])
@permission_classes([AllowAny])
def google_callback(request):
    if not _google_configured():
        return Response(
            {"error": "Google OAuth is not configured."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    error = request.query_params.get("error")
    if error:
        logger.warning("Google OAuth returned error: %s", error)
        return redirect(_build_frontend_redirect({"error": error}))

    state = request.query_params.get("state")
    stored_state = request.session.pop("google_oauth_state", None)
    if not state or not stored_state or state != stored_state:
        logger.warning("Google OAuth state mismatch: expected=%s got=%s", stored_state, state)
        return redirect(_build_frontend_redirect({"error": "state_mismatch"}))

    code = request.query_params.get("code")
    if not code:
        return redirect(_build_frontend_redirect({"error": "missing_code"}))

    try:
        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
        token_response.raise_for_status()
        token_data = token_response.json()
    except requests.RequestException as exc:  # pragma: no cover - network
        logger.exception("Google token exchange failed: %s", exc)
        return redirect(_build_frontend_redirect({"error": "token_exchange_failed"}))

    access_token = token_data.get("access_token")
    if not access_token:
        logger.error("Google token response missing access_token: %s", token_data)
        return redirect(_build_frontend_redirect({"error": "missing_access_token"}))

    try:
        userinfo_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        userinfo_response.raise_for_status()
        profile = userinfo_response.json()
    except requests.RequestException as exc:  # pragma: no cover - network
        logger.exception("Fetching Google user info failed: %s", exc)
        return redirect(_build_frontend_redirect({"error": "userinfo_fetch_failed"}))

    email = profile.get("email")
    if not email:
        logger.error("Google user info missing email: %s", profile)
        return redirect(_build_frontend_redirect({"error": "missing_email"}))

    first_name = profile.get("given_name") or ""
    last_name = profile.get("family_name") or ""

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "username": email,
            "first_name": first_name,
            "last_name": last_name,
        },
    )

    if created:
        user.set_unusable_password()
        user.save(update_fields=["password"])
    else:
        fields_to_update = []
        if first_name and user.first_name != first_name:
            user.first_name = first_name
            fields_to_update.append("first_name")
        if last_name and user.last_name != last_name:
            user.last_name = last_name
            fields_to_update.append("last_name")
        if fields_to_update:
            user.save(update_fields=fields_to_update)

    refresh = RefreshToken.for_user(user)
    redirect_params = {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
    }
    return redirect(_build_frontend_redirect(redirect_params))


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/v1/auth/login/", login, name="login"),
    path("api/v1/auth/signup/", signup, name="signup"),
    path("api/auth/google/login/", google_login, name="google_login"),
    path("api/auth/google/callback/", google_callback, name="google_callback"),
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
     # dj-rest-auth basic login/registration (optional if you use email/pass too)
    path("api/auth/", include("dj_rest_auth.urls")),
    path("api/auth/registration/", include("dj_rest_auth.registration.urls")),
    path("api/exercises/", include("exercises.urls")),
    path("api/workouts/", include("workouts.urls")),
    # allauth Google provider endpoints:
    # This gives you /api/auth/google/login/ and /api/auth/google/login/callback/
    path("api/auth/google/", include("allauth.socialaccount.providers.google.urls")),
    path('api/', include(router.urls)),
    #resetpassowrd
    path("api/v1/auth/password/reset/", password_reset_request, name="password_reset_request"),
    path("api/v1/auth/password/reset/confirm/", password_reset_confirm, name="password_reset_confirm"),
]

# Serve media files in development
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
