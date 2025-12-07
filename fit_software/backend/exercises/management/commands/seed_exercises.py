from django.core.management.base import BaseCommand
from exercises.models import Exercise

# The class MUST be named 'Command'
class Command(BaseCommand):
    help = 'Populates the database with default global exercises'

    def handle(self, *args, **kwargs):
        defaults = [
            {"name": "Bench Press (Barbell)", "category": "strength", "metric": "weight"},
            {"name": "Squat (Barbell)", "category": "strength", "metric": "weight"},
            {"name": "Deadlift (Barbell)", "category": "strength", "metric": "weight"},
            {"name": "Push Up", "category": "strength", "metric": "reps"},
            {"name": "Pull Up", "category": "strength", "metric": "reps"},
            {"name": "Running", "category": "cardio", "metric": "distance"},
            {"name": "Cycling", "category": "cardio", "metric": "distance"},
            {"name": "Plank", "category": "strength", "metric": "time"},
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