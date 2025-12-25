"""
Unit tests for the Workouts app.

Tests cover:
- Workout Models (Template, Session, Exercise, Set)
- Workout Serializers
- Workout API business logic
"""

from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from exercises.models import Exercise
from .models import WorkoutTemplate, TemplateExercise, WorkoutSession, WorkoutExercise, WorkoutSet
from .serializers import (
    WorkoutTemplateSerializer,
    TemplateExerciseSerializer,
    WorkoutSessionSerializer,
    WorkoutSetSerializer,
    WorkoutExerciseSerializer,
)


#  MODEL TESTS 
class WorkoutTemplateModelTest(TestCase):
    """Test the WorkoutTemplate model"""

    def setUp(self):
        """Create test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpass123'
        )

    def test_create_workout_template(self):
        """Test creating a workout template"""
        template = WorkoutTemplate.objects.create(
            user=self.user,
            title='Full Body Workout',
            description='Complete body routine',
            is_ai_generated=False
        )
        self.assertEqual(template.user, self.user)
        self.assertEqual(template.title, 'Full Body Workout')
        self.assertFalse(template.is_ai_generated)

    def test_template_string_representation(self):
        """Test template string representation"""
        template = WorkoutTemplate.objects.create(
            user=self.user,
            title='Leg Day',
        )
        self.assertEqual(str(template), 'Leg Day')

    def test_template_created_at_timestamp(self):
        """Test that created_at is automatically set"""
        before = timezone.now()
        template = WorkoutTemplate.objects.create(
            user=self.user,
            title='Test Template'
        )
        after = timezone.now()
        self.assertGreaterEqual(template.created_at, before)
        self.assertLessEqual(template.created_at, after)

    def test_multiple_templates_per_user(self):
        """Test that user can have multiple templates"""
        template1 = WorkoutTemplate.objects.create(
            user=self.user,
            title='Workout 1'
        )
        template2 = WorkoutTemplate.objects.create(
            user=self.user,
            title='Workout 2'
        )
        user_templates = WorkoutTemplate.objects.filter(user=self.user)
        self.assertEqual(user_templates.count(), 2)

    def test_ai_generated_flag(self):
        """Test AI generated flag"""
        template_ai = WorkoutTemplate.objects.create(
            user=self.user,
            title='AI Workout',
            is_ai_generated=True
        )
        template_manual = WorkoutTemplate.objects.create(
            user=self.user,
            title='Manual Workout',
            is_ai_generated=False
        )
        self.assertTrue(template_ai.is_ai_generated)
        self.assertFalse(template_manual.is_ai_generated)


class TemplateExerciseModelTest(TestCase):
    """Test the TemplateExercise model"""

    def setUp(self):
        """Create test data"""
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.template = WorkoutTemplate.objects.create(user=self.user, title='Test Template')
        self.exercise = Exercise.objects.create(
            name='Squat',
            category='strength',
            metric_type='weight'
        )

    def test_create_template_exercise(self):
        """Test adding exercise to template"""
        template_ex = TemplateExercise.objects.create(
            template=self.template,
            exercise=self.exercise,
            order=1,
            sets=3,
            target_reps=8
        )
        self.assertEqual(template_ex.template, self.template)
        self.assertEqual(template_ex.exercise, self.exercise)
        self.assertEqual(template_ex.sets, 3)
        self.assertEqual(template_ex.target_reps, 8)

    def test_template_exercise_ordering(self):
        """Test that exercises are ordered"""
        ex1 = Exercise.objects.create(name='Ex1', category='strength', metric_type='weight')
        ex2 = Exercise.objects.create(name='Ex2', category='strength', metric_type='weight')
        
        t_ex1 = TemplateExercise.objects.create(
            template=self.template, exercise=ex1, order=2
        )
        t_ex2 = TemplateExercise.objects.create(
            template=self.template, exercise=ex2, order=1
        )
        
        # Query should return ordered by 'order' field
        exercises = TemplateExercise.objects.all()
        self.assertEqual(exercises[0].order, 1)
        self.assertEqual(exercises[1].order, 2)

    def test_template_exercises_relationship(self):
        """Test inverse relationship from template"""
        TemplateExercise.objects.create(
            template=self.template,
            exercise=self.exercise,
            order=1
        )
        self.assertEqual(self.template.template_exercises.count(), 1)


class WorkoutSessionModelTest(TestCase):
    """Test the WorkoutSession model"""

    def setUp(self):
        """Create test data"""
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.template = WorkoutTemplate.objects.create(user=self.user, title='Test Template')

    def test_create_workout_session(self):
        """Test creating a workout session"""
        session = WorkoutSession.objects.create(
            user=self.user,
            template=self.template,
            title='Leg Day Session',
            duration_minutes=60,
            mood_emoji='💪'
        )
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.template, self.template)
        self.assertEqual(session.duration_minutes, 60)
        self.assertFalse(session.is_completed)

    def test_session_without_template(self):
        """Test creating session without template"""
        session = WorkoutSession.objects.create(
            user=self.user,
            title='Quick Session',
            template=None
        )
        self.assertIsNone(session.template)

    def test_session_default_date(self):
        """Test that date defaults to now"""
        before = timezone.now()
        session = WorkoutSession.objects.create(
            user=self.user,
            title='Test'
        )
        after = timezone.now()
        self.assertGreaterEqual(session.date, before)
        self.assertLessEqual(session.date, after)

    def test_session_completion_flag(self):
        """Test completion flag"""
        session = WorkoutSession.objects.create(
            user=self.user,
            title='Test',
            is_completed=False
        )
        self.assertFalse(session.is_completed)
        
        session.is_completed = True
        session.save()
        self.assertTrue(session.is_completed)

    def test_session_string_representation(self):
        """Test session string representation"""
        session = WorkoutSession.objects.create(
            user=self.user,
            title='Leg Day',
            date=timezone.datetime(2025, 12, 25, tzinfo=timezone.utc)
        )
        self.assertIn('Leg Day', str(session))


class WorkoutExerciseModelTest(TestCase):
    """Test the WorkoutExercise model"""

    def setUp(self):
        """Create test data"""
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.session = WorkoutSession.objects.create(user=self.user, title='Test Session')
        self.exercise = Exercise.objects.create(
            name='Bench Press',
            category='strength',
            metric_type='weight'
        )

    def test_create_workout_exercise(self):
        """Test creating workout exercise in session"""
        workout_ex = WorkoutExercise.objects.create(
            workout=self.session,
            exercise=self.exercise,
            order=1,
            notes='Heavy day'
        )
        self.assertEqual(workout_ex.workout, self.session)
        self.assertEqual(workout_ex.exercise, self.exercise)
        self.assertEqual(workout_ex.notes, 'Heavy day')

    def test_workout_exercise_default_order(self):
        """Test default order value"""
        workout_ex = WorkoutExercise.objects.create(
            workout=self.session,
            exercise=self.exercise
        )
        self.assertEqual(workout_ex.order, 1)

    def test_multiple_exercises_in_session(self):
        """Test multiple exercises in one session"""
        ex1 = Exercise.objects.create(name='Ex1', category='strength', metric_type='weight')
        ex2 = Exercise.objects.create(name='Ex2', category='cardio', metric_type='distance')
        
        WorkoutExercise.objects.create(workout=self.session, exercise=ex1, order=1)
        WorkoutExercise.objects.create(workout=self.session, exercise=ex2, order=2)
        
        self.assertEqual(self.session.exercises.count(), 2)


class WorkoutSetModelTest(TestCase):
    """Test the WorkoutSet model"""

    def setUp(self):
        """Create test data"""
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.session = WorkoutSession.objects.create(user=self.user, title='Test')
        self.exercise = Exercise.objects.create(name='Squat', category='strength', metric_type='weight')
        self.workout_ex = WorkoutExercise.objects.create(
            workout=self.session,
            exercise=self.exercise
        )

    def test_create_workout_set(self):
        """Test creating a workout set"""
        workout_set = WorkoutSet.objects.create(
            workout_exercise=self.workout_ex,
            set_number=1,
            weight_kg=100,
            reps=8,
            rpe=8
        )
        self.assertEqual(workout_set.set_number, 1)
        self.assertEqual(workout_set.weight_kg, 100)
        self.assertEqual(workout_set.reps, 8)
        self.assertEqual(workout_set.rpe, 8)
        self.assertFalse(workout_set.is_completed)

    def test_set_completion_flag(self):
        """Test set completion"""
        workout_set = WorkoutSet.objects.create(
            workout_exercise=self.workout_ex,
            set_number=1,
            is_completed=False
        )
        self.assertFalse(workout_set.is_completed)
        
        workout_set.is_completed = True
        workout_set.save()
        self.assertTrue(workout_set.is_completed)

    def test_multiple_sets_per_exercise(self):
        """Test multiple sets for one exercise"""
        WorkoutSet.objects.create(workout_exercise=self.workout_ex, set_number=1, reps=8)
        WorkoutSet.objects.create(workout_exercise=self.workout_ex, set_number=2, reps=8)
        WorkoutSet.objects.create(workout_exercise=self.workout_ex, set_number=3, reps=8)
        
        self.assertEqual(self.workout_ex.sets.count(), 3)

    def test_set_ordering_by_set_number(self):
        """Test that sets are ordered by set number"""
        WorkoutSet.objects.create(workout_exercise=self.workout_ex, set_number=3)
        WorkoutSet.objects.create(workout_exercise=self.workout_ex, set_number=1)
        WorkoutSet.objects.create(workout_exercise=self.workout_ex, set_number=2)
        
        sets = WorkoutSet.objects.all()
        self.assertEqual(sets[0].set_number, 1)
        self.assertEqual(sets[1].set_number, 2)
        self.assertEqual(sets[2].set_number, 3)


class WorkoutTemplateCreateSessionTest(TestCase):
    """Test the create_session method"""

    def setUp(self):
        """Create test data"""
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.exercise1 = Exercise.objects.create(name='Squat', category='strength', metric_type='weight')
        self.exercise2 = Exercise.objects.create(name='Bench Press', category='strength', metric_type='weight')
        
        self.template = WorkoutTemplate.objects.create(
            user=self.user,
            title='Full Body'
        )
        
        TemplateExercise.objects.create(
            template=self.template,
            exercise=self.exercise1,
            order=1,
            sets=3,
            target_reps=8
        )
        TemplateExercise.objects.create(
            template=self.template,
            exercise=self.exercise2,
            order=2,
            sets=4,
            target_reps=10
        )

    def test_create_session_from_template(self):
        """Test creating session copies template structure"""
        session = self.template.create_session()
        
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.template, self.template)
        self.assertEqual(session.title, self.template.title)
        self.assertFalse(session.is_completed)

    def test_create_session_copies_exercises(self):
        """Test that session gets exercises from template"""
        session = self.template.create_session()
        
        self.assertEqual(session.exercises.count(), 2)
        exercises = session.exercises.all()
        self.assertEqual(exercises[0].exercise, self.exercise1)
        self.assertEqual(exercises[1].exercise, self.exercise2)

    def test_create_session_creates_sets(self):
        """Test that sets are pre-created based on template"""
        session = self.template.create_session()
        
        workout_exercises = session.exercises.all()
        sets1 = workout_exercises[0].sets.count()
        sets2 = workout_exercises[1].sets.count()
        
        self.assertEqual(sets1, 3)  # First exercise has 3 sets
        self.assertEqual(sets2, 4)  # Second exercise has 4 sets

    def test_create_session_sets_target_reps(self):
        """Test that created sets have target reps from template"""
        session = self.template.create_session()
        
        workout_ex = session.exercises.first()
        set1 = workout_ex.sets.first()
        
        self.assertEqual(set1.reps, 8)  # Target reps from template


#  SERIALIZER TESTS 
class WorkoutTemplateSerializerTest(TestCase):
    """Test WorkoutTemplate serializer"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.template = WorkoutTemplate.objects.create(
            user=self.user,
            title='Test Template',
            description='Test Description'
        )

    def test_serialize_template(self):
        """Test serializing template"""
        serializer = WorkoutTemplateSerializer(self.template)
        self.assertEqual(serializer.data['title'], 'Test Template')
        self.assertEqual(serializer.data['description'], 'Test Description')
        self.assertEqual(serializer.data['exercise_count'], 0)

    def test_template_exercise_count(self):
        """Test exercise count calculation"""
        exercise = Exercise.objects.create(name='Test', category='strength', metric_type='weight')
        TemplateExercise.objects.create(
            template=self.template,
            exercise=exercise,
            order=1
        )
        
        serializer = WorkoutTemplateSerializer(self.template)
        self.assertEqual(serializer.data['exercise_count'], 1)

    def test_template_total_sets(self):
        """Test total sets calculation"""
        exercise = Exercise.objects.create(name='Test', category='strength', metric_type='weight')
        TemplateExercise.objects.create(
            template=self.template,
            exercise=exercise,
            order=1,
            sets=5
        )
        
        serializer = WorkoutTemplateSerializer(self.template)
        self.assertEqual(serializer.data['total_sets'], 5)


class WorkoutSetSerializerTest(TestCase):
    """Test WorkoutSet serializer"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.session = WorkoutSession.objects.create(user=self.user, title='Test')
        self.exercise = Exercise.objects.create(name='Test', category='strength', metric_type='weight')
        self.workout_ex = WorkoutExercise.objects.create(workout=self.session, exercise=self.exercise)
        self.set = WorkoutSet.objects.create(
            workout_exercise=self.workout_ex,
            set_number=1,
            weight_kg=100,
            reps=8,
            rpe=7
        )

    def test_serialize_set(self):
        """Test serializing set"""
        serializer = WorkoutSetSerializer(self.set)
        self.assertEqual(serializer.data['set_number'], 1)
        self.assertEqual(serializer.data['weight_kg'], 100)
        self.assertEqual(serializer.data['reps'], 8)
        self.assertEqual(serializer.data['rpe'], 7)

    def test_set_completion_serialization(self):
        """Test set completion in serialization"""
        serializer = WorkoutSetSerializer(self.set)
        self.assertEqual(serializer.data['is_completed'], False)


#  BUSINESS LOGIC TESTS 
class WorkoutBusinessLogicTest(TestCase):
    """Test workout business logic"""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.exercise = Exercise.objects.create(
            name='Squat',
            category='strength',
            metric_type='weight'
        )

    def test_user_can_only_see_own_templates(self):
        """Test user isolation for templates"""
        user2 = User.objects.create_user(username='user2', password='pass123')
        
        template1 = WorkoutTemplate.objects.create(user=self.user, title='User1 Template')
        template2 = WorkoutTemplate.objects.create(user=user2, title='User2 Template')
        
        user1_templates = WorkoutTemplate.objects.filter(user=self.user)
        self.assertEqual(user1_templates.count(), 1)
        self.assertEqual(user1_templates.first(), template1)

    def test_user_can_only_see_own_sessions(self):
        """Test user isolation for sessions"""
        user2 = User.objects.create_user(username='user2', password='pass123')
        
        session1 = WorkoutSession.objects.create(user=self.user, title='User1 Session')
        session2 = WorkoutSession.objects.create(user=user2, title='User2 Session')
        
        user1_sessions = WorkoutSession.objects.filter(user=self.user)
        self.assertEqual(user1_sessions.count(), 1)
        self.assertEqual(user1_sessions.first(), session1)

    def test_session_with_completed_sets(self):
        """Test tracking completed sets"""
        session = WorkoutSession.objects.create(user=self.user, title='Test')
        workout_ex = WorkoutExercise.objects.create(workout=session, exercise=self.exercise)
        
        set1 = WorkoutSet.objects.create(workout_exercise=workout_ex, set_number=1)
        set2 = WorkoutSet.objects.create(workout_exercise=workout_ex, set_number=2)
        
        set1.is_completed = True
        set1.save()
        
        completed_sets = WorkoutSet.objects.filter(is_completed=True)
        self.assertEqual(completed_sets.count(), 1)

    def test_template_exercise_removal(self):
        """Test removing exercises from template"""
        template = WorkoutTemplate.objects.create(user=self.user, title='Test')
        
        TemplateExercise.objects.create(template=template, exercise=self.exercise, order=1)
        self.assertEqual(template.template_exercises.count(), 1)
        
        template.template_exercises.all().delete()
        self.assertEqual(template.template_exercises.count(), 0)

    def test_session_deletion_cascades_to_exercises_and_sets(self):
        """Test cascade deletion"""
        session = WorkoutSession.objects.create(user=self.user, title='Test')
        workout_ex = WorkoutExercise.objects.create(workout=session, exercise=self.exercise)
        workout_set = WorkoutSet.objects.create(workout_exercise=workout_ex, set_number=1)
        
        session_id = session.id
        workout_ex_id = workout_ex.id
        set_id = workout_set.id
        
        session.delete()
        
        self.assertFalse(WorkoutSession.objects.filter(id=session_id).exists())
        self.assertFalse(WorkoutExercise.objects.filter(id=workout_ex_id).exists())
        self.assertFalse(WorkoutSet.objects.filter(id=set_id).exists())

    def test_template_deletion_cascades_to_exercises(self):
        """Test template cascade deletion"""
        template = WorkoutTemplate.objects.create(user=self.user, title='Test')
        template_ex = TemplateExercise.objects.create(
            template=template,
            exercise=self.exercise,
            order=1
        )
        
        template_id = template.id
        template_ex_id = template_ex.id
        
        template.delete()
        
        self.assertFalse(WorkoutTemplate.objects.filter(id=template_id).exists())
        self.assertFalse(TemplateExercise.objects.filter(id=template_ex_id).exists())
        
        
class WorkoutAPITest(APITestCase):
    """Test the API endpoints (Views) directly"""

    def setUp(self):
        self.user = User.objects.create_user(username='apitestuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.template = WorkoutTemplate.objects.create(user=self.user, title="API Template")

    def test_get_workout_sessions(self):
        """Test GET /api/workouts/sessions/"""
        url = '/api/workouts/sessions/' 
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_workout_template_via_api(self):
        """Test POST /api/workouts/templates/"""
        url = '/api/workouts/templates/' 
        data = {
            "title": "New API Template",
            "description": "Created via test",
            "exercises_data": [] 
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WorkoutTemplate.objects.count(), 2)

    def test_get_template_detail(self):
        """Test GET /api/workouts/templates/{id}/"""
        url = f'/api/workouts/templates/{self.template.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "API Template")       

    def test_start_session_action(self):
        """Test starting a session from template"""
        url = f'/api/workouts/templates/{self.template.id}/start_session/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED) 
        self.assertTrue(WorkoutSession.objects.filter(template=self.template).exists())

    def test_add_set_to_session(self):
        """Test adding a set to a running session"""
        session = WorkoutSession.objects.create(user=self.user, title="Active Session")
        exercise = Exercise.objects.create(name="Test Pushup", category="strength", metric_type="reps")
        
        url = f'/api/workouts/sessions/{session.id}/add_set/'
        data = {
            "exercise_id": exercise.id,
            "weight_kg": 0,
            "reps": 15,
            "rpe": 8
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED) 
        self.assertEqual(session.exercises.count(), 1)

    def test_complete_workout(self):
        """Test completing a workout"""
        session = WorkoutSession.objects.create(user=self.user, title="Finishing Session")
        
        url = f'/api/workouts/sessions/{session.id}/complete/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session.refresh_from_db()
        self.assertTrue(session.is_completed)

    def test_update_session_details(self):
        """Test updating notes/duration"""
        session = WorkoutSession.objects.create(user=self.user, title="Old Title")
        
        url = f'/api/workouts/sessions/{session.id}/update_session/'
        data = {
            "title": "New Title",
            "duration_minutes": 45,
            "notes": "Updated via test"
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        session.refresh_from_db()
        self.assertEqual(session.title, "New Title")

    def test_get_stats(self):
        """Test stats endpoint"""
        session = WorkoutSession.objects.create(
            user=self.user, 
            title="Stats Session", 
            is_completed=True,
            duration_minutes=60
        )
        
        url = '/api/workouts/sessions/stats/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_workouts', response.data)

    def test_delete_template(self):
        """Test deleting a template"""
        temp_to_delete = WorkoutTemplate.objects.create(user=self.user, title="Delete Me")
        url = f'/api/workouts/templates/{temp_to_delete.id}/'
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(WorkoutTemplate.objects.filter(id=temp_to_delete.id).exists())

    def test_create_template_invalid_data(self):
        """Test creating template with missing title (Should Fail)"""
        url = '/api/workouts/templates/'
        data = {
            "description": "No title here", 
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_set_invalid_payload(self):
        """Test adding set with missing fields"""
        session = WorkoutSession.objects.create(user=self.user, title="Test Session")
        url = f'/api/workouts/sessions/{session.id}/add_set/'
        data = {
            "weight_kg": 100 
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_access_other_user_session(self):
        """Test accessing another user's session (Security Check)"""
        other_user = User.objects.create_user(username='hacker', password='123')
        other_session = WorkoutSession.objects.create(user=other_user, title="Secret Workout")        
        url = f'/api/workouts/sessions/{other_session.id}/'
        response = self.client.get(url)        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_template(self):
        """Test deleting a template that doesn't exist"""
        url = '/api/workouts/templates/99999/' 
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_start_session_from_nonexistent_template(self):
        """Test starting session from invalid template ID"""
        url = '/api/workouts/templates/99999/start_session/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_complete_already_completed_workout(self):
        """Test completing a workout that's already completed"""
        session = WorkoutSession.objects.create(
            user=self.user,
            title="Already Done",
            is_completed=True
        )
        url = f'/api/workouts/sessions/{session.id}/complete/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_add_set_to_completed_workout(self):
        """Test adding a set to a completed workout (Should Fail)"""
        session = WorkoutSession.objects.create(
            user=self.user,
            title="Finished Session",
            is_completed=True
        )
        url = f'/api/workouts/sessions/{session.id}/add_set/'
        data = {
            "exercise_id": self.exercise.id,
            "weight_kg": 80,
            "reps": 10,
            "rpe": 7
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)     
        
    def test_update_set_details(self):
        """Test updating a specific set"""
        session = WorkoutSession.objects.create(user=self.user, title="Set Edit Session")
        exercise = Exercise.objects.create(name="Curl", category="strength", metric_type="weight")
        workout_ex = WorkoutExercise.objects.create(workout=session, exercise=exercise)
        workout_set = WorkoutSet.objects.create(workout_exercise=workout_ex, set_number=1, weight_kg=10)
        
        url = f'/api/workouts/sessions/{session.id}/update_set/'
        data = {
            "set_id": workout_set.id,
            "weight_kg": 20, 
            "reps": 12
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        workout_set.refresh_from_db()
        self.assertEqual(workout_set.weight_kg, 20)

    def test_delete_set_action(self):
        """Test deleting a specific set via query param"""
        session = WorkoutSession.objects.create(user=self.user, title="Set Delete Session")
        exercise = Exercise.objects.create(name="Curl", category="strength", metric_type="weight")
        workout_ex = WorkoutExercise.objects.create(workout=session, exercise=exercise)
        workout_set = WorkoutSet.objects.create(workout_exercise=workout_ex, set_number=1)
        
        url = f'/api/workouts/sessions/{session.id}/delete_set/?set_id={workout_set.id}'
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(WorkoutSet.objects.filter(id=workout_set.id).exists())

    def test_update_exercise_notes(self):
        """Test updating exercise notes/order"""
        session = WorkoutSession.objects.create(user=self.user, title="Ex Edit Session")
        exercise = Exercise.objects.create(name="Press", category="strength", metric_type="weight")
        workout_ex = WorkoutExercise.objects.create(workout=session, exercise=exercise, notes="Old Note")
        
        url = f'/api/workouts/sessions/{session.id}/update_exercise/'
        data = {
            "exercise_id": workout_ex.id,
            "notes": "New Note",
            "order": 5
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        workout_ex.refresh_from_db()
        self.assertEqual(workout_ex.notes, "New Note")

    def test_delete_exercise_action(self):
        """Test deleting an exercise via query param"""
        session = WorkoutSession.objects.create(user=self.user, title="Ex Delete Session")
        exercise = Exercise.objects.create(name="Press", category="strength", metric_type="weight")
        workout_ex = WorkoutExercise.objects.create(workout=session, exercise=exercise)
        
        url = f'/api/workouts/sessions/{session.id}/delete_exercise/?exercise_id={workout_ex.id}'
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(WorkoutExercise.objects.filter(id=workout_ex.id).exists())

    def test_ai_suggestion_endpoint(self):
        """Test AI suggestion endpoint (Mocking or checking failure)"""
        url = '/api/workouts/templates/suggest/'
        data = {"title": "Leg Day", "notes": "Hardcore"}    
        try:
            self.client.post(url, data, format='json')
        except:
            pass                           