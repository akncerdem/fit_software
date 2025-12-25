from rest_framework import generics, permissions
from django.db.models import Q
from .models import Exercise
from .serializers import ExerciseSerializer

class ExerciseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        search_query = self.request.query_params.get('search', '')

        # HYBRID LOGIC:
        # Return exercises where (Created By is System/Null) OR (Created By is Me)
        queryset = Exercise.objects.filter(
            Q(created_by__isnull=True) | Q(created_by=user)
        )

        if search_query:
            queryset = queryset.filter(name__icontains=search_query)
            
        return queryset

    def perform_create(self, serializer):
        # Automatically assign the current user so it becomes a "Custom" exercise
        serializer.save(created_by=self.request.user)

class ExerciseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, or deleting a single Exercise.
    """
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Exercise.objects.all()

    def get_queryset(self):
        user = self.request.user
        # Ensure users can only access exercises they created or system exercises
        return Exercise.objects.filter(
            Q(created_by__isnull=True) | Q(created_by=user)
        )
    def perform_update(self, serializer):
        # Ensure that only the owner can update the exercise
        if self.get_object().created_by != self.request.user:
            raise PermissionDenied("You do not have permission to edit this exercise.")
        serializer.save()        