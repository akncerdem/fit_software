from django.contrib import admin
from .models import (
    Profile,
    Goal,
    Challenge,
    ChallengeJoined,
    Movement,
    WorkoutLog,
    Badge,
)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "fitness_level", "height", "weight")

# --- ARKADAŞLARININ YOLLADIĞI DÜZELTİLMİŞ KISIM ---
@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "user",
        "current_value",
        "target_value",
        "unit",
        "is_active",
        "created_at",
    )
    search_fields = ("title", "user__username", "user__email")
    list_filter = ("is_active", "unit", "created_at")
# ----------------------------------------------------

class ChallengeJoinedInline(admin.TabularInline):
    model = ChallengeJoined
    extra = 0

@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ("title", "created_user", "created_at")
    inlines = [ChallengeJoinedInline]

@admin.register(Movement)
class MovementAdmin(admin.ModelAdmin):
    list_display = ("name", "category")

@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "date", "created_at")
    search_fields = ("title", "user__email")

@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("badge_type", "user", "awarded_at")