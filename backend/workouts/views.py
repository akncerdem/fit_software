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

import os
import re
import json
import requests

# --- AI WORKOUT SUGGESTION HELPERS ---
def _is_obviously_invalid(t: str) -> bool:
    """Only catch the most obvious invalid inputs. Let AI decide the rest."""
    t = (t or "").strip()
    
    # Too short
    if len(t) < 2:
        return True

    # No letters at all
    if not re.search(r"[a-zA-ZçğıöşüÇĞİÖŞÜ]", t):
        return True

    # Same character repeated (aaaa, 1111)
    if re.fullmatch(r"(.)\1{2,}", t):
        return True

    return False


def _extract_json(text: str):
    if not text:
        return None
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None


def _groq_chat(prompt: str, model=None, profile_data=None):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None, "Missing GROQ_API_KEY"

    url = "https://api.groq.com/openai/v1/chat/completions"
    model = model or os.getenv("GROQ_MODEL") or "llama-3.1-8b-instant"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    # Build personalized system message - AI decides if input is valid
    base_system = (
        "You are a fitness coach. Return ONLY valid JSON. No markdown, no explanations.\n\n"
        "FIRST: Determine if the input is a valid workout/exercise request. "
        "If the input is gibberish, random characters, keyboard mashing (like 'qwerty', 'asdf', 'xyz123'), "
        "or completely unrelated to fitness/workouts, return:\n"
        '{"recognized": false, "message": "This doesn\'t appear to be a workout. Please describe what exercise you want to do.", "alternative": null}\n\n'
        "If it IS a valid workout request, create a workout suggestion.\n"
    )
    
    # Add personalization based on profile if available
    if profile_data:
        fitness_level = profile_data.get("fitness_level")
        height = profile_data.get("height")
        weight = profile_data.get("weight")
        
        if fitness_level or height or weight:
            base_system += "IMPORTANT: Personalize the workout based on the user's profile.\n"
            
            if fitness_level == "no_exercise":
                base_system += (
                    "The user is a BEGINNER who doesn't exercise regularly. "
                    "Suggest FEWER sets (2-3), LOWER reps (6-8), and include REST periods. "
                    "Choose simpler exercises that are easier to perform.\n"
                )
            elif fitness_level == "regular":
                base_system += (
                    "The user is ADVANCED and exercises 3+ times per week. "
                    "Suggest MORE sets (4-5), HIGHER reps (10-15), and include challenging variations. "
                    "You can include complex compound movements.\n"
                )
            else:  # sometimes or unknown
                base_system += (
                    "The user has INTERMEDIATE fitness level. "
                    "Suggest moderate sets (3-4) and standard rep ranges (8-12).\n"
                )
    
    base_system += (
        "\nSchema for valid workouts: {\"recognized\": true, \"message\": \"string\", \"alternative\": {\"title\": \"string\", \"notes\": \"string\", \"exercises\": [{\"name\": \"string\", \"sets\": int, \"reps\": \"string\"}]}}"
    )

    payload = {
        "model": model,
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": base_system,
            },
            {"role": "user", "content": prompt},
        ],
    }

    try:
        r = requests.post(url, headers=headers, json=payload, timeout=15)
        if r.status_code >= 400:
            return None, f"Groq error {r.status_code}: {r.text[:200]}"
        data = r.json()
        content = data["choices"][0]["message"]["content"]
        return content, None
    except Exception as e:
        return None, str(e)

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


    @action(detail=False, methods=['post'], url_path='suggest')
    def suggest(self, request):
        title = (request.data.get('title') or '').strip()
        notes = (request.data.get('notes') or request.data.get('description') or '').strip()
        
        # Get profile data from request (optional - for personalized suggestions)
        profile_data = request.data.get('profile') or {}
    
        # Only catch obviously invalid inputs (empty, no letters, repeated chars)
        if _is_obviously_invalid(title):
            return Response({
                "recognized": False,
                "message": "Please enter a valid workout title.",
                "alternative": None
            }, status=status.HTTP_200_OK)
    
        # Build prompt - let AI decide if it's a valid workout
        prompt = f"User wants to create a workout with:\nTitle: {title}\nNotes: {notes}\n\n"
        
        if profile_data.get('height') or profile_data.get('weight') or profile_data.get('fitness_level'):
            prompt += "User Profile:\n"
            if profile_data.get('height'):
                prompt += f"- Height: {profile_data['height']} cm\n"
            if profile_data.get('weight'):
                prompt += f"- Weight: {profile_data['weight']} kg\n"
            if profile_data.get('fitness_level'):
                fitness_labels = {
                    "no_exercise": "Beginner (doesn't exercise)",
                    "sometimes": "Intermediate (sometimes exercises)",
                    "regular": "Active (exercises 3+ times/week)"
                }
                prompt += f"- Fitness Level: {fitness_labels.get(profile_data['fitness_level'], profile_data['fitness_level'])}\n"
            prompt += "\nPlease tailor the workout to this user's fitness level.\n\n"
        
        prompt += (
            "Is this a valid workout request? If yes, create a workout with 4-8 exercises. "
            "Use concise exercise names like 'Back Squat', 'Bench Press', 'Deadlift'. "
            "If no, explain why this isn't a valid workout request."
        )
    
        content, err = _groq_chat(prompt, profile_data=profile_data)
        if content:
            parsed = _extract_json(content)
            if isinstance(parsed, dict) and "recognized" in parsed and "message" in parsed:
                if not parsed.get("recognized"):
                    parsed["alternative"] = None
                else:
                    alt = parsed.get("alternative") or {}
                    exs = alt.get("exercises") or []
                    if not isinstance(exs, list):
                        exs = []
                    cleaned = []
                    for ex in exs[:10]:
                        if not isinstance(ex, dict):
                            continue
                        name = str(ex.get("name") or "").strip()
                        if not name:
                            continue
                        sets = ex.get("sets", 3)
                        try:
                            sets = int(sets)
                        except Exception:
                            sets = 3
                        reps = str(ex.get("reps") or "8-12").strip() or "8-12"
                        cleaned.append({"name": name, "sets": sets, "reps": reps})
                    parsed["alternative"] = {
                        "title": str(alt.get("title") or title).strip() or title,
                        "notes": str(alt.get("notes") or notes).strip(),
                        "exercises": cleaned
                    }
                return Response(parsed, status=status.HTTP_200_OK)
    
        # Fallback (rule-based) if Groq fails
        lower = title.lower()
    
        if any(k in lower for k in ["leg", "squat", "lower"]):
            exercises = [
                {"name": "Back Squat", "sets": 4, "reps": "5-8"},
                {"name": "Romanian Deadlift", "sets": 3, "reps": "8-10"},
                {"name": "Leg Press", "sets": 3, "reps": "10-12"},
                {"name": "Walking Lunges", "sets": 3, "reps": "10-12"},
                {"name": "Calf Raises", "sets": 3, "reps": "12-15"},
            ]
            return Response({
                "recognized": True,
                "message": "Suggested a lower-body strength session based on your title.",
                "alternative": {"title": title, "notes": notes, "exercises": exercises}
            }, status=status.HTTP_200_OK)
    
        if any(k in lower for k in ["push", "chest", "bench"]):
            exercises = [
                {"name": "Bench Press", "sets": 4, "reps": "5-8"},
                {"name": "Incline Dumbbell Press", "sets": 3, "reps": "8-12"},
                {"name": "Overhead Press", "sets": 3, "reps": "6-10"},
                {"name": "Triceps Pushdown", "sets": 3, "reps": "10-12"},
                {"name": "Lateral Raises", "sets": 3, "reps": "12-15"},
            ]
            return Response({
                "recognized": True,
                "message": "Suggested an upper-body push session based on your title.",
                "alternative": {"title": title, "notes": notes, "exercises": exercises}
            }, status=status.HTTP_200_OK)
    
        if any(k in lower for k in ["pull", "back", "row"]):
            exercises = [
                {"name": "Pull-Ups", "sets": 4, "reps": "6-10"},
                {"name": "Barbell Row", "sets": 3, "reps": "6-10"},
                {"name": "Lat Pulldown", "sets": 3, "reps": "10-12"},
                {"name": "Face Pulls", "sets": 3, "reps": "12-15"},
                {"name": "Biceps Curls", "sets": 3, "reps": "10-12"},
            ]
            return Response({
                "recognized": True,
                "message": "Suggested an upper-body pull session based on your title.",
                "alternative": {"title": title, "notes": notes, "exercises": exercises}
            }, status=status.HTTP_200_OK)
    
        return Response({
            "recognized": False,
            "message": "Unknown goal. Please provide a clear description of your fitness    goal.",
            "alternative": None
        }, status=status.HTTP_200_OK)


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
        was_completed = session.is_completed
        session.is_completed = True
        
        if 'duration_minutes' in request.data:
            session.duration_minutes = request.data['duration_minutes']
        if 'mood_emoji' in request.data:
            session.mood_emoji = request.data['mood_emoji']
        if 'notes' in request.data:
            session.notes = request.data['notes']
        
        session.save()
        
        # Log activity for completed workout and check for badges
        new_badge = None
        if not was_completed:
            from django.utils import timezone
            from django.conf import settings
            import pytz
            from fitware.goals import ActivityLog
            from fitware.badges import BadgeService
            from fitware.models import Badge
            
            local_tz = pytz.timezone(settings.TIME_ZONE)
            today = timezone.now().astimezone(local_tz).date()
            ActivityLog.objects.get_or_create(
                user=request.user,
                date=today,
                action_type='workout_completed'
            )
            
            # Get badges before check
            badges_before = set(Badge.objects.filter(user=request.user).values_list('badge_type', flat=True))
            
            # Check and award badges
            BadgeService.check_milestone_badges(request.user)
            
            # Get badges after check to find newly earned badge
            badges_after = set(Badge.objects.filter(user=request.user).values_list('badge_type', flat=True))
            new_badges = badges_after - badges_before
            
            if new_badges:
                new_badge = list(new_badges)[0]  # Get the first new badge
        
        # Return response with session data and new badge info
        response_data = WorkoutSessionSerializer(session).data
        if new_badge:
            response_data['new_badge'] = new_badge
        
        return Response(response_data)

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