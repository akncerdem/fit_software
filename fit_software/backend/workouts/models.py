from django.db import models
from django.conf import settings
from django.utils import timezone
from exercises.models import Exercise  # Import from your new app

# --- PART A: The Blueprint (Templates) ---
class WorkoutTemplate(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='templates')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def create_session(self):
        """
        Creates a new active session from this template.
        """
        new_session = WorkoutSession.objects.create(
            user=self.user,
            template=self,
            title=self.title,
            date=timezone.now()
        )
        
        # Copy exercises from Template -> Session
        # Create multiple logs based on the number of sets in template
        for tmpl_ex in self.template_exercises.all():
            for set_num in range(1, tmpl_ex.sets + 1):
                SessionLog.objects.create(
                    session=new_session,
                    exercise=tmpl_ex.exercise,
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
    reps = models.CharField(max_length=50, help_text="Target reps (e.g. '8-12')")
    target_reps = models.PositiveIntegerField(default=0, help_text="Target reps as number (for reference)")

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
    notes = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False) # To track if they clicked "Finish"

    def __str__(self):
        return f"{self.title} ({self.date.date()})"

class SessionLog(models.Model):
    session = models.ForeignKey(WorkoutSession, related_name='logs', on_delete=models.CASCADE)
    exercise = models.ForeignKey(Exercise, on_delete=models.PROTECT)
    set_number = models.PositiveIntegerField()
    weight_kg = models.FloatField(null=True, blank=True)
    reps = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ['exercise', 'set_number']