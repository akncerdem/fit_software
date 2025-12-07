from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkoutTemplateViewSet, WorkoutSessionViewSet

router = DefaultRouter()
router.register(r'templates', WorkoutTemplateViewSet, basename='workout-template')
router.register(r'sessions', WorkoutSessionViewSet, basename='workout-session')

urlpatterns = [
    path('', include(router.urls)),
]