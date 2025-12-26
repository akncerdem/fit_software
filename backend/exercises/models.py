from django.db import models
from django.conf import settings

class Exercise(models.Model):
    # If this is NULL, it is a "Global" exercise (System Default).
    # If it has a User, it is a "Custom" exercise created by that person.
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='custom_exercises'
    )
    
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=[
        ('strength', 'Strength'),
        ('cardio', 'Cardio'),
        ('flexibility', 'Flexibility')
    ])
   #video_url = models.URLField(blank=True, null=True)

    # --- ADDED FIELD 2: For Frontend Logic ---
    metric_type = models.CharField(max_length=20, default='weight', choices=[
        ('weight', 'Weight (kg/lbs)'),
        ('distance', 'Distance (km/mi)'),
        ('time', 'Time (duration)'),
        ('reps', 'Reps Only')
    ])
    
    class Meta:
        # Optimization: Search often happens by name
        indexes = [models.Index(fields=['name'])]
        # Constraint: A user cannot create "Squat" if they already made "Squat"
        # Note: We technically allow them to create "Squat" even if Global "Squat" exists
        # so they can have their own version, but duplicates within their own list are blocked.
        unique_together = ('name', 'created_by')

    def __str__(self):
        type_label = "Custom" if self.created_by else "Global"
        return f"{self.name} ({type_label})"