from django.urls import path
from .views import ExerciseListCreateView

urlpatterns = [
    # GET /api/exercises/ -> Lists all exercises
    # POST /api/exercises/ -> Creates a new custom exercise
    path('', ExerciseListCreateView.as_view(), name='exercise-list-create'),
]