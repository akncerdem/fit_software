from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import WorkoutTemplate, WorkoutSession
from .serializers import WorkoutTemplateSerializer, WorkoutSessionSerializer

class WorkoutTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing and editing Workout Templates (Plans).
    """
    serializer_class = WorkoutTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show templates created by the logged-in user
        return WorkoutTemplate.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        """
        Pass the request context to the serializer.
        This is needed so the serializer can access the user.
        """
        return {'request': self.request}

    def perform_create(self, serializer):
        # The user is now set inside the serializer's create method
        serializer.save()

    @action(detail=True, methods=['post'])
    def start_session(self, request, pk=None):
        """
        Custom Action: POST /api/workouts/templates/{id}/start_session/
        Logic: Copies the template into a new session so the user can start logging.
        """
        template = self.get_object()
        # This calls the method we wrote in models.py
        new_session = template.create_session()
        
        # Return the new session data to the frontend
        serializer = WorkoutSessionSerializer(new_session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class WorkoutSessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for the User's Workout History (Logs).
    """
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Show newest workouts first
        return WorkoutSession.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)