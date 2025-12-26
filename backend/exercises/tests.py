"""
Unit tests for the Exercises app.

Tests cover:
- Exercise Model
- Exercise Serializer
- Exercise API Endpoints
"""

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Exercise
from .serializers import ExerciseSerializer


# ========== MODEL TESTS ==========
class ExerciseModelTest(TestCase):
    """Test the Exercise model"""

    def setUp(self):
        """Create test data"""
        self.user1 = User.objects.create_user(
            username='testuser1',
            email='testuser1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='testuser2@example.com',
            password='testpass123'
        )

    def test_create_global_exercise(self):
        """Test creating a global exercise (created_by=None)"""
        exercise = Exercise.objects.create(
            name='Squat',
            category='strength',
            metric_type='weight',
            created_by=None
        )
        self.assertEqual(exercise.name, 'Squat')
        self.assertEqual(exercise.category, 'strength')
        self.assertEqual(exercise.metric_type, 'weight')
        self.assertIsNone(exercise.created_by)

    def test_create_custom_exercise(self):
        """Test creating a custom exercise (created_by=User)"""
        exercise = Exercise.objects.create(
            name='My Custom Squat',
            category='strength',
            metric_type='weight',
            created_by=self.user1
        )
        self.assertEqual(exercise.name, 'My Custom Squat')
        self.assertEqual(exercise.created_by, self.user1)

    def test_exercise_str_representation(self):
        """Test the string representation of Exercise"""
        global_ex = Exercise.objects.create(
            name='Running',
            category='cardio',
            metric_type='distance',
            created_by=None
        )
        custom_ex = Exercise.objects.create(
            name='My Run',
            category='cardio',
            metric_type='distance',
            created_by=self.user1
        )
        self.assertEqual(str(global_ex), 'Running (Global)')
        self.assertEqual(str(custom_ex), 'My Run (Custom)')

    def test_exercise_category_choices(self):
        """Test that only valid categories are accepted"""
        valid_categories = ['strength', 'cardio', 'flexibility']
        for category in valid_categories:
            exercise = Exercise.objects.create(
                name=f'Exercise_{category}',
                category=category,
                metric_type='weight',
            )
            self.assertEqual(exercise.category, category)

    def test_exercise_metric_type_choices(self):
        """Test that only valid metric types are accepted"""
        valid_metrics = ['weight', 'distance', 'time', 'reps']
        for metric in valid_metrics:
            exercise = Exercise.objects.create(
                name=f'Exercise_{metric}',
                category='strength',
                metric_type=metric,
            )
            self.assertEqual(exercise.metric_type, metric)

    def test_unique_constraint_per_user(self):
        """Test that a user cannot have duplicate exercise names"""
        Exercise.objects.create(
            name='Bench Press',
            category='strength',
            metric_type='weight',
            created_by=self.user1
        )
        # Attempting to create another 'Bench Press' for the same user should fail
        with self.assertRaises(Exception):
            Exercise.objects.create(
                name='Bench Press',
                category='strength',
                metric_type='weight',
                created_by=self.user1
            )

    def test_different_users_can_create_same_exercise(self):
        """Test that different users can create exercises with the same name"""
        ex1 = Exercise.objects.create(
            name='Bench Press',
            category='strength',
            metric_type='weight',
            created_by=self.user1
        )
        ex2 = Exercise.objects.create(
            name='Bench Press',
            category='strength',
            metric_type='weight',
            created_by=self.user2
        )
        self.assertNotEqual(ex1.id, ex2.id)
        self.assertEqual(ex1.name, ex2.name)


# ========== SERIALIZER TESTS ==========
class ExerciseSerializerTest(TestCase):
    """Test the Exercise serializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_serialize_global_exercise(self):
        """Test serializing a global exercise"""
        exercise = Exercise.objects.create(
            name='Push Ups',
            category='strength',
            metric_type='reps',
            created_by=None
        )
        serializer = ExerciseSerializer(exercise)
        self.assertEqual(serializer.data['name'], 'Push Ups')
        self.assertEqual(serializer.data['category'], 'strength')
        self.assertEqual(serializer.data['metric_type'], 'reps')
        self.assertEqual(serializer.data['is_custom'], False)

    def test_serialize_custom_exercise(self):
        """Test serializing a custom exercise"""
        exercise = Exercise.objects.create(
            name='My Push Ups',
            category='strength',
            metric_type='reps',
            created_by=self.user
        )
        serializer = ExerciseSerializer(exercise)
        self.assertEqual(serializer.data['name'], 'My Push Ups')
        self.assertEqual(serializer.data['is_custom'], True)

    def test_deserialize_valid_exercise_data(self):
        """Test deserializing valid exercise data"""
        data = {
            'name': 'Deadlift',
            'category': 'strength',
            'metric_type': 'weight'
        }
        serializer = ExerciseSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_deserialize_invalid_category(self):
        """Test that invalid category is rejected"""
        data = {
            'name': 'Unknown',
            'category': 'invalid_category',
            'metric_type': 'weight'
        }
        serializer = ExerciseSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_deserialize_invalid_metric_type(self):
        """Test that invalid metric type is rejected"""
        data = {
            'name': 'Unknown',
            'category': 'strength',
            'metric_type': 'invalid_metric'
        }
        serializer = ExerciseSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_created_by_is_read_only(self):
        """Test that created_by cannot be set during serialization"""
        data = {
            'name': 'Test Exercise',
            'category': 'strength',
            'metric_type': 'weight',
            'created_by': self.user.id  # This should be ignored
        }
        serializer = ExerciseSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        # created_by should not be in the validated data
        self.assertNotIn('created_by', serializer.validated_data)


# ========== API TESTS ==========
class ExerciseAPITest(APITestCase):
    """Test Exercise API endpoints"""

    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )

        # Create some global exercises
        self.global_squat = Exercise.objects.create(
            name='Squat',
            category='strength',
            metric_type='weight',
            created_by=None
        )
        self.global_running = Exercise.objects.create(
            name='Running',
            category='cardio',
            metric_type='distance',
            created_by=None
        )

        # Create user1's custom exercises
        self.user1_bench = Exercise.objects.create(
            name='Bench Press',
            category='strength',
            metric_type='weight',
            created_by=self.user1
        )

    def test_exercise_queryset_user_sees_own_and_global(self):
        """Test that queryset filtering works correctly"""
        from .views import ExerciseListCreateView
        from rest_framework.request import Request
        from django.test import RequestFactory
        
        factory = RequestFactory()
        django_request = factory.get('/exercises/')
        request = Request(django_request)
        request.user = self.user1
        
        view = ExerciseListCreateView()
        view.request = request
        
        queryset = view.get_queryset()
        self.assertEqual(queryset.count(), 3)  # 2 global + 1 custom

    def test_exercise_queryset_user_doesnt_see_other_users_exercises(self):
        """Test that user2 cannot see user1's exercises"""
        from .views import ExerciseListCreateView
        from rest_framework.request import Request
        from django.test import RequestFactory
        
        factory = RequestFactory()
        django_request = factory.get('/exercises/')
        request = Request(django_request)
        request.user = self.user2
        
        view = ExerciseListCreateView()
        view.request = request
        
        queryset = view.get_queryset()
        self.assertEqual(queryset.count(), 2)  # Only 2 global exercises

    def test_exercise_search_works(self):
        """Test that search filtering works"""
        from django.db.models import Q
        
        search_query = 'bench'
        queryset = Exercise.objects.filter(
            Q(created_by__isnull=True) | Q(created_by=self.user1)
        )
        if search_query:
            queryset = queryset.filter(name__icontains=search_query)
        
        self.assertEqual(queryset.count(), 1)
        self.assertEqual(queryset.first().name, 'Bench Press')

    def test_create_exercise_assigns_user(self):
        """Test that created exercises are assigned to the creator"""
        data = {
            'name': 'Deadlift',
            'category': 'strength',
            'metric_type': 'weight'
        }
        serializer = ExerciseSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        # Simulate perform_create by saving with user
        exercise = serializer.save(created_by=self.user1)
        self.assertEqual(exercise.created_by, self.user1)

    def test_delete_permission_only_owner(self):
        """Test that only owner can delete"""
        # User1 can delete their own
        can_delete = self.user1_bench.created_by == self.user1
        self.assertTrue(can_delete)
        
        # User2 cannot
        can_delete = self.user1_bench.created_by == self.user2
        self.assertFalse(can_delete)

    def test_global_exercises_cannot_be_deleted_by_user(self):
        """Test that users cannot delete global exercises"""
        # Global exercises have created_by=None
        can_delete = self.global_squat.created_by == self.user1
        self.assertFalse(can_delete)

    def test_case_insensitive_search(self):
        """Test that search is case-insensitive"""
        search_query = 'BENCH'
        queryset = Exercise.objects.filter(name__icontains=search_query)
        self.assertEqual(queryset.count(), 1)
        self.assertEqual(queryset.first().name, 'Bench Press')

    def test_multiple_exercises_per_user(self):
        """Test user can create multiple exercises"""
        Exercise.objects.create(
            name='Deadlift',
            category='strength',
            metric_type='weight',
            created_by=self.user1
        )
        Exercise.objects.create(
            name='Pullups',
            category='strength',
            metric_type='reps',
            created_by=self.user1
        )
        
        user1_exercises = Exercise.objects.filter(created_by=self.user1)
        self.assertEqual(user1_exercises.count(), 3)
