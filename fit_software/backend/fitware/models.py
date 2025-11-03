from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    photo_url = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    fitness_level = models.CharField(max_length=100, blank=True)
    height = models.FloatField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Profile({self.user})"

class Goal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="goals")
    title = models.CharField(max_length=255)
    target_value = models.CharField(max_length=200, blank=True)
    target_type = models.CharField(max_length=100, blank=True)
    due_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Goal({self.title} - {self.user})"

class Challenge(models.Model):
    goal = models.ForeignKey(Goal, null=True, blank=True, on_delete=models.SET_NULL, related_name="challenges")
    title = models.CharField(max_length=255)
    created_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_challenges")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Challenge({self.title})"

class ChallengeJoined(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name="joins")
    joined_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="challenge_members")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("challenge", "joined_user")

    def __str__(self):
        return f"{self.joined_user} in {self.challenge}"

class Movement(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name

class WorkoutLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="workout_logs")
    date = models.DateField()
    title = models.CharField(max_length=255, blank=True)
    movements_json = models.JSONField(default=list, blank=True)  # store movement details as JSON
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"WorkoutLog({self.user} - {self.date})"

class Badge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="badges")
    badge_type = models.CharField(max_length=200)
    awarded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Badge({self.badge_type} - {self.user})"