from django.db import models
from django.contrib.auth.models import User

from .goals import Goal


# PROFILE
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True, null=True)
    fitness_level = models.CharField(max_length=50, blank=True, choices=[
        ('no_exercise', 'I don\'t exercise'),
        ('sometimes', 'Sometimes exercise'),
        ('regular', 'Regular (3+ times per week)')
    ])
    height = models.FloatField(help_text="Height in cm", null=True, blank=True)
    weight = models.FloatField(help_text="Weight in kg", null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

# CHALLENGE
class Challenge(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_challenges')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

#  CHALLENGE JOINED (Ara Tablo)
class ChallengeJoined(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} -> {self.challenge.title}"

#  MOVEMENT 
class Movement(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, choices=[
        ('cardio', 'Cardio'),
        ('strength', 'Strength'),
        ('flexibility', 'Flexibility')
    ])
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

# 6. WORKOUT LOG
class WorkoutLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.user.username}"

# 7. BADGE
class Badge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    badge_type = models.CharField(max_length=100)
    awarded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.badge_type} - {self.user.username}"