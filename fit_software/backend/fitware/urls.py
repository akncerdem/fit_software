from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

def health(request):
    return JsonResponse({"status": "ok", "service": "fitware", "version": "0.1.0"})

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        data = request.data
        email = data.get('email', '')
        password = data.get('password', '')
        
        if not email or not password:
            return Response(
                {"error": "Email ve şifre gereklidir"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authenticate user
        user = authenticate(username=email, password=password)
        if not user:
            return Response(
                {"error": "Geçersiz email veya şifre"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "message": "Giriş başarılı",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            },
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Giriş sırasında hata oluştu: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    try:
        data = request.data
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        email = data.get('email', '')
        password = data.get('password', '')
        repeat_password = data.get('repeat_password', '')
        
        # Validation
        if not all([first_name, last_name, email, password, repeat_password]):
            return Response(
                {"error": "Tüm alanlar zorunludur"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if password != repeat_password:
            return Response(
                {"error": "Şifreler eşleşmiyor"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Bu email adresi zaten kullanılıyor"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(username=email).exists():
            return Response(
                {"error": "Bu email adresi zaten kullanılıyor"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "message": "Hesap başarıyla oluşturuldu",
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            },
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {"error": f"Kayıt sırasında hata oluştu: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/v1/auth/login/", login, name="login"),
    path("api/v1/auth/signup/", signup, name="signup"),

     # JWT auth
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]