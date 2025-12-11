from django.core.management.base import BaseCommand
from exercises.models import Exercise

# The class MUST be named 'Command'
class Command(BaseCommand):
    help = 'Populates the database with default global exercises'

    def handle(self, *args, **kwargs):
        defaults = [
            # Strength - Chest
            {"name": "Bench Press (Barbell)", "category": "strength", "metric": "weight"},
            {"name": "Bench Press (Dumbbell)", "category": "strength", "metric": "weight"},
            {"name": "Incline Bench Press", "category": "strength", "metric": "weight"},
            {"name": "Chest Fly (Dumbbell)", "category": "strength", "metric": "weight"},
            {"name": "Push Up", "category": "strength", "metric": "reps"},
            {"name": "Dips", "category": "strength", "metric": "reps"},
            
            # Strength - Back
            {"name": "Deadlift (Barbell)", "category": "strength", "metric": "weight"},
            {"name": "Pull Up", "category": "strength", "metric": "reps"},
            {"name": "Chin Up", "category": "strength", "metric": "reps"},
            {"name": "Bent Over Row (Barbell)", "category": "strength", "metric": "weight"},
            {"name": "Bent Over Row (Dumbbell)", "category": "strength", "metric": "weight"},
            {"name": "Lat Pulldown", "category": "strength", "metric": "weight"},
            {"name": "Seated Cable Row", "category": "strength", "metric": "weight"},
            
            # Strength - Legs
            {"name": "Squat (Barbell)", "category": "strength", "metric": "weight"},
            {"name": "Squat (Dumbbell)", "category": "strength", "metric": "weight"},
            {"name": "Leg Press", "category": "strength", "metric": "weight"},
            {"name": "Lunges", "category": "strength", "metric": "weight"},
            {"name": "Leg Extension", "category": "strength", "metric": "weight"},
            {"name": "Leg Curl", "category": "strength", "metric": "weight"},
            {"name": "Calf Raise", "category": "strength", "metric": "weight"},
            {"name": "Romanian Deadlift", "category": "strength", "metric": "weight"},
            
            # Strength - Shoulders
            {"name": "Overhead Press (Barbell)", "category": "strength", "metric": "weight"},
            {"name": "Shoulder Press (Dumbbell)", "category": "strength", "metric": "weight"},
            {"name": "Lateral Raise", "category": "strength", "metric": "weight"},
            {"name": "Front Raise", "category": "strength", "metric": "weight"},
            {"name": "Face Pull", "category": "strength", "metric": "weight"},
            {"name": "Shrugs", "category": "strength", "metric": "weight"},
            
            # Strength - Arms
            {"name": "Bicep Curl (Barbell)", "category": "strength", "metric": "weight"},
            {"name": "Bicep Curl (Dumbbell)", "category": "strength", "metric": "weight"},
            {"name": "Hammer Curl", "category": "strength", "metric": "weight"},
            {"name": "Tricep Pushdown", "category": "strength", "metric": "weight"},
            {"name": "Tricep Extension", "category": "strength", "metric": "weight"},
            {"name": "Skull Crushers", "category": "strength", "metric": "weight"},
            
            # Strength - Core
            {"name": "Plank", "category": "strength", "metric": "time"},
            {"name": "Sit Up", "category": "strength", "metric": "reps"},
            {"name": "Crunches", "category": "strength", "metric": "reps"},
            {"name": "Russian Twist", "category": "strength", "metric": "reps"},
            {"name": "Leg Raise", "category": "strength", "metric": "reps"},
            {"name": "Mountain Climbers", "category": "strength", "metric": "reps"},
            
            # Cardio
            {"name": "Running", "category": "cardio", "metric": "distance"},
            {"name": "Cycling", "category": "cardio", "metric": "distance"},
            {"name": "Swimming", "category": "cardio", "metric": "distance"},
            {"name": "Rowing Machine", "category": "cardio", "metric": "distance"},
            {"name": "Jump Rope", "category": "cardio", "metric": "time"},
            {"name": "Burpees", "category": "cardio", "metric": "reps"},
            {"name": "Jumping Jacks", "category": "cardio", "metric": "reps"},
            {"name": "Treadmill Walking", "category": "cardio", "metric": "distance"},
            {"name": "Elliptical", "category": "cardio", "metric": "time"},
            {"name": "Stair Climber", "category": "cardio", "metric": "time"},
            
            # Flexibility
            {"name": "Stretching", "category": "flexibility", "metric": "time"},
            {"name": "Yoga", "category": "flexibility", "metric": "time"},
            {"name": "Foam Rolling", "category": "flexibility", "metric": "time"},
            {"name": "Hip Flexor Stretch", "category": "flexibility", "metric": "time"},
            {"name": "Hamstring Stretch", "category": "flexibility", "metric": "time"},
            {"name": "Shoulder Stretch", "category": "flexibility", "metric": "time"},
        ]

        count = 0
        for data in defaults:
            # created_by=None means it is a GLOBAL exercise
            obj, created = Exercise.objects.get_or_create(
                name=data["name"],
                defaults={
                    "category": data["category"],
                    "metric_type": data["metric"],
                    "created_by": None
                }
            )
            if created:
                count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully added {count} new global exercises!'))