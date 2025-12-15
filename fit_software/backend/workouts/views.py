from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, F
# 1. Update Imports
from .models import WorkoutTemplate, WorkoutSession, WorkoutExercise, WorkoutSet
from .serializers import (
    WorkoutTemplateSerializer, 
    WorkoutSessionSerializer, 
    WorkoutSetSerializer,
    WorkoutExerciseSerializer,
)

class WorkoutTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing and editing Workout Templates (Plans).
    """
    serializer_class = WorkoutTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutTemplate.objects.filter(user=self.request.user).prefetch_related('template_exercises__exercise')

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def start_session(self, request, pk=None):
        template = self.get_object()
        # This calls the method we updated in models.py (which creates the 3-layer structure)
        new_session = template.create_session()
        serializer = WorkoutSessionSerializer(new_session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for the User's Workout History.
    """
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # 2. Update Prefetching: Get Session -> Exercises -> Sets
        return WorkoutSession.objects.filter(user=self.request.user)\
            .prefetch_related('exercises__exercise', 'exercises__sets')\
            .order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # --- NEW: Add a Set (Smart Logic) ---
    @action(detail=True, methods=['post'])
    def add_set(self, request, pk=None):
        """
        Custom Action: POST /api/workouts/sessions/{id}/add_set/
        Body: { exercise_id: 5, weight_kg: 50, reps: 10, rpe: 8 }
        """
        session = self.get_object()
        exercise_id = request.data.get('exercise_id')
        
        if not exercise_id:
            return Response({'error': 'exercise_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # A. Find or Create the 'Container' (WorkoutExercise) for this exercise
        # This allows us to group sets under one header in the UI
        workout_exercise, created = WorkoutExercise.objects.get_or_create(
            workout=session,
            exercise_id=exercise_id,
            defaults={'order': session.exercises.count() + 1}
        )

        # B. Calculate the next set number
        next_set_num = workout_exercise.sets.count() + 1

        # C. Create the Set
        new_set = WorkoutSet.objects.create(
            workout_exercise=workout_exercise,
            set_number=next_set_num,
            weight_kg=request.data.get('weight_kg', 0),
            reps=request.data.get('reps', 0),
            rpe=request.data.get('rpe')
        )
        
        return Response(WorkoutSetSerializer(new_set).data, status=status.HTTP_201_CREATED)

    # --- UPDATED: Update Set ---
    @action(detail=True, methods=['patch'])
    def update_set(self, request, pk=None):
        """
        Custom Action: PATCH /api/workouts/sessions/{id}/update_set/
        Body: { set_id: ID, weight_kg: 55, reps: 12 }
        """
        session = self.get_object()
        set_id = request.data.get('set_id')
        
        # Verify the set belongs to this session (security check)
        try:
            workout_set = WorkoutSet.objects.get(
                id=set_id, 
                workout_exercise__workout=session
            )
        except WorkoutSet.DoesNotExist:
            return Response({'error': 'Set not found in this session'}, status=status.HTTP_404_NOT_FOUND)
        
        # Update fields
        if 'weight_kg' in request.data:
            workout_set.weight_kg = request.data['weight_kg']
        if 'reps' in request.data:
            workout_set.reps = request.data['reps']
        if 'rpe' in request.data:
            workout_set.rpe = request.data['rpe']
        
        workout_set.save()
        return Response(WorkoutSetSerializer(workout_set).data)

    # --- UPDATED: Delete Set ---
    @action(detail=True, methods=['delete'])
    def delete_set(self, request, pk=None):
        """
        Custom Action: DELETE /api/workouts/sessions/{id}/delete_set/?set_id=ID
        """
        session = self.get_object()
        set_id = request.query_params.get('set_id')
        
        try:
            workout_set = WorkoutSet.objects.get(
                id=set_id, 
                workout_exercise__workout=session
            )
            
            # Optional: Check if this was the last set. 
            # If so, maybe delete the WorkoutExercise container too?
            parent_exercise = workout_set.workout_exercise
            workout_set.delete()
            
            if parent_exercise.sets.count() == 0:
                parent_exercise.delete()
                
            return Response(status=status.HTTP_204_NO_CONTENT)
        except WorkoutSet.DoesNotExist:
            return Response({'error': 'Set not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        session = self.get_object()
        session.is_completed = True
        
        if 'duration_minutes' in request.data:
            session.duration_minutes = request.data['duration_minutes']
        if 'mood_emoji' in request.data:
            session.mood_emoji = request.data['mood_emoji']
        if 'notes' in request.data:
            session.notes = request.data['notes']
        
        session.save()
        return Response(WorkoutSessionSerializer(session).data)

    # --- UPDATED: Stats ---
    @action(detail=False, methods=['get'])
    def stats(self, request):
        user_sessions = WorkoutSession.objects.filter(user=request.user, is_completed=True)
        
        total_workouts = user_sessions.count()
        total_duration = user_sessions.aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        # Querying the new WorkoutSet table
        all_sets = WorkoutSet.objects.filter(workout_exercise__workout__user=request.user, workout_exercise__workout__is_completed=True)
        
        # Calculate Volume (Weight * Reps)
        # We use F() expressions to do the math in the database
        total_volume = all_sets.aggregate(
            volume=Sum(F('weight_kg') * F('reps'))
        )['volume'] or 0

        total_sets = all_sets.count()
        total_reps = all_sets.aggregate(total=Sum('reps'))['total'] or 0
        
        # Most used exercises (Traverse up: Set -> WorkoutExercise -> Exercise)
        exercise_counts = all_sets.values('workout_exercise__exercise__name').annotate(
            count=Count('workout_exercise__exercise')
        ).order_by('-count')[:5]
        
        # Clean up the keys for the frontend
        top_exercises = [
            {'name': item['workout_exercise__exercise__name'], 'count': item['count']} 
            for item in exercise_counts
        ]
        
        return Response({
            'total_workouts': total_workouts,
            'total_duration_minutes': total_duration,
            'total_volume_kg': total_volume,
            'total_sets': total_sets,
            'total_reps': total_reps,
            'top_exercises': top_exercises
        })

    @action(detail=True, methods=['patch'])
    def update_session(self, request, pk=None):
        """
        Custom Action: PATCH /api/workouts/sessions/{id}/update_session/
        Update session fields like title, duration_minutes, notes.
        """
        session = self.get_object()
        serializer = self.get_serializer(session, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_exercise(self, request, pk=None):
        """
        Custom Action: PATCH /api/workouts/sessions/{id}/update_exercise/
        Update an exercise container inside a session (e.g., notes/order).
        Request body: { exercise_id: ID, notes: "...", order: 2 }
        """
        session = self.get_object()
        exercise_id = request.data.get('exercise_id')
        if not exercise_id:
            return Response({'error': 'exercise_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            workout_ex = WorkoutExercise.objects.get(id=exercise_id, workout=session)
        except WorkoutExercise.DoesNotExist:
            return Response({'error': 'WorkoutExercise not found in this session'}, status=status.HTTP_404_NOT_FOUND)

        # Update allowed fields
        if 'notes' in request.data:
            workout_ex.notes = request.data['notes']
        if 'order' in request.data:
            workout_ex.order = request.data['order']
        workout_ex.save()

        return Response(WorkoutExerciseSerializer(workout_ex).data)

    @action(detail=True, methods=['delete'])
    def delete_exercise(self, request, pk=None):
        """
        Custom Action: DELETE /api/workouts/sessions/{id}/delete_exercise/?exercise_id=ID
        Delete a WorkoutExercise (container) and its sets from a session.
        """
        session = self.get_object()
        exercise_id = request.query_params.get('exercise_id')
        if not exercise_id:
            return Response({'error': 'exercise_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            workout_ex = WorkoutExercise.objects.get(id=exercise_id, workout=session)
            workout_ex.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except WorkoutExercise.DoesNotExist:
            return Response({'error': 'WorkoutExercise not found'}, status=status.HTTP_404_NOT_FOUND)