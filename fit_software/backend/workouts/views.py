from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from .models import WorkoutTemplate, WorkoutSession, SessionLog
from .serializers import WorkoutTemplateSerializer, WorkoutSessionSerializer, SessionLogSerializer

class WorkoutTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing and editing Workout Templates (Plans).
    """
    serializer_class = WorkoutTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show templates created by the logged-in user
        return WorkoutTemplate.objects.filter(user=self.request.user).prefetch_related('template_exercises__exercise')

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
        return WorkoutSession.objects.filter(user=self.request.user).prefetch_related('logs__exercise').order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_log(self, request, pk=None):
        """
        Custom Action: POST /api/workouts/sessions/{id}/add_log/
        Add a new set log to an existing session.
        Body: { exercise: ID, set_number: 1, weight_kg: 50, reps: 10 }
        """
        session = self.get_object()
        serializer = SessionLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(session=session)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def update_log(self, request, pk=None):
        """
        Custom Action: PATCH /api/workouts/sessions/{id}/update_log/
        Update an existing log entry.
        Body: { log_id: ID, weight_kg: 55, reps: 12 }
        """
        session = self.get_object()
        log_id = request.data.get('log_id')
        
        try:
            log = SessionLog.objects.get(id=log_id, session=session)
        except SessionLog.DoesNotExist:
            return Response({'error': 'Log not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Update fields if provided
        if 'weight_kg' in request.data:
            log.weight_kg = request.data['weight_kg']
        if 'reps' in request.data:
            log.reps = request.data['reps']
        if 'set_number' in request.data:
            log.set_number = request.data['set_number']
        
        log.save()
        serializer = SessionLogSerializer(log)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'])
    def delete_log(self, request, pk=None):
        """
        Custom Action: DELETE /api/workouts/sessions/{id}/delete_log/
        Delete a log entry.
        Query param: ?log_id=ID
        """
        session = self.get_object()
        log_id = request.query_params.get('log_id')
        
        try:
            log = SessionLog.objects.get(id=log_id, session=session)
            log.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SessionLog.DoesNotExist:
            return Response({'error': 'Log not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Custom Action: POST /api/workouts/sessions/{id}/complete/
        Mark a session as completed.
        Body: { duration_minutes: 45, mood_emoji: "💪", notes: "Great workout!" }
        """
        session = self.get_object()
        session.is_completed = True
        
        if 'duration_minutes' in request.data:
            session.duration_minutes = request.data['duration_minutes']
        if 'mood_emoji' in request.data:
            session.mood_emoji = request.data['mood_emoji']
        if 'notes' in request.data:
            session.notes = request.data['notes']
        
        session.save()
        serializer = WorkoutSessionSerializer(session)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Custom Action: GET /api/workouts/sessions/stats/
        Get overall workout statistics for the user.
        """
        user_sessions = WorkoutSession.objects.filter(user=request.user, is_completed=True)
        
        total_workouts = user_sessions.count()
        total_duration = user_sessions.aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        # Get total volume (weight * reps) across all sessions
        all_logs = SessionLog.objects.filter(session__user=request.user, session__is_completed=True)
        total_volume = sum((log.weight_kg or 0) * (log.reps or 0) for log in all_logs)
        total_sets = all_logs.count()
        total_reps = sum(log.reps or 0 for log in all_logs)
        
        # Most used exercises
        exercise_counts = all_logs.values('exercise__name').annotate(
            count=Count('exercise')
        ).order_by('-count')[:5]
        
        return Response({
            'total_workouts': total_workouts,
            'total_duration_minutes': total_duration,
            'total_volume_kg': total_volume,
            'total_sets': total_sets,
            'total_reps': total_reps,
            'top_exercises': list(exercise_counts)
        })