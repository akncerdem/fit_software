from django.urls import path
from .views import ExerciseListCreateView,ExerciseDetailView

urlpatterns = [
    # GET /api/exercises/ -> Lists all exercises
    # POST /api/exercises/ -> Creates a new custom exercise
    path('', ExerciseListCreateView.as_view(), name='exercise-list-create'),

    # 2. Edit, Delete, and Retrieve Single (PUT/PATCH/DELETE/GET)
    # The URL for this is: http://localhost:8000/api/exercises/5/
    # NOTICE: We use just '<int:pk>/', not 'exercises/<int:pk>/'
    path('<int:pk>/',ExerciseDetailView.as_view(), name='exercise-detail'),
]