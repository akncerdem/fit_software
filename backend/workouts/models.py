from django.db import models
from django.conf import settings
from django.utils import timezone
from exercises.models import Exercise 

# --- PART A: The Blueprint (Templates) ---
# (This part was mostly fine, just ensuring it matches the new structure below)
class WorkoutTemplate(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='templates')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_ai_generated = models.BooleanField(default=False)
    
    def __str__(self):
        return self.title

    def create_session(self):
        """
        Creates a new active session from this template.
        """
        # 1. Create the Session
        new_session = WorkoutSession.objects.create(
            user=self.user,
            template=self,
            title=self.title,
            date=timezone.now()
        )
        
        # 2. Copy Exercises and pre-fill Sets
        for tmpl_ex in self.template_exercises.all():
            # Create the 'Container' for this exercise in this session
            workout_exercise = WorkoutExercise.objects.create(
                workout=new_session,
                exercise=tmpl_ex.exercise,
                order=tmpl_ex.order,
            )

            # Create the empty sets based on template counts
            for set_num in range(1, tmpl_ex.sets + 1):
                WorkoutSet.objects.create(
                    workout_exercise=workout_exercise,
                    set_number=set_num,
                    reps=tmpl_ex.target_reps,
                    weight_kg=0
                )
        return new_session

class TemplateExercise(models.Model):
    template = models.ForeignKey(WorkoutTemplate, related_name='template_exercises', on_delete=models.CASCADE)
    exercise = models.ForeignKey(Exercise, on_delete=models.PROTECT)
    order = models.PositiveIntegerField()
    sets = models.PositiveIntegerField(default=3)
    target_reps = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

# --- PART B: The History (Sessions) ---

class WorkoutSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions')
    template = models.ForeignKey(WorkoutTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    date = models.DateTimeField(default=timezone.now)
    duration_minutes = models.PositiveIntegerField(default=0)
    mood_emoji = models.CharField(max_length=10, blank=True, null=True)
    notes = models.TextField(blank=True) # General notes for the whole day
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.date.date()})"

# NEW: The "Container" for a specific exercise in a session
class WorkoutExercise(models.Model):
    workout = models.ForeignKey(WorkoutSession, related_name='exercises', on_delete=models.CASCADE)
    exercise = models.ForeignKey(Exercise, on_delete=models.PROTECT)
    order = models.PositiveIntegerField(default=1) 
    notes = models.TextField(blank=True) # Specific notes (e.g., "Knee pain on this lift")

    class Meta:
        ordering = ['order']

# RENAMED: 'SessionLog' becomes 'WorkoutSet' and links to the WorkoutExercise
class WorkoutSet(models.Model):
    workout_exercise = models.ForeignKey(WorkoutExercise, related_name='sets', on_delete=models.CASCADE)
    set_number = models.PositiveIntegerField()
    weight_kg = models.FloatField(default=0)
    reps = models.PositiveIntegerField(default=0)
    rpe = models.PositiveIntegerField(null=True, blank=True) # Rate of Perceived Exertion (1-10)
    is_completed = models.BooleanField(default=False)

    class Meta:
        ordering = ['set_number']