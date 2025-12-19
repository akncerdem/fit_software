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


# PROFILE
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "fitness_level", "height", "weight")
    search_fields = ("user__username", "user__email")
    list_filter = ("fitness_level",)


# GOAL
@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "user",
        "current_value",
        "target_value",
        "unit",
        "is_completed",
        "is_active",
        "due_date",
        "created_at",
    )
    search_fields = ("title", "user__username", "user__email")
    list_filter = ("is_active", "is_completed", "unit", "created_at")


# CHALLENGE + JOINED
class ChallengeJoinedInline(admin.TabularInline):
    model = ChallengeJoined
    extra = 0


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ("title", "created_user", "badge_name", "due_date", "created_at")
    search_fields = (
        "title",
        "created_user__username",
        "created_user__email",
        "badge_name",
    )
    list_filter = ("due_date", "created_user")
    inlines = [ChallengeJoinedInline]


# MOVEMENT
@admin.register(Movement)
class MovementAdmin(admin.ModelAdmin):
    list_display = ("name", "category")
    list_filter = ("category",)
    search_fields = ("name",)


# WORKOUT LOG
@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "date", "created_at")
    search_fields = ("title", "user__email", "user__username")
    list_filter = ("date",)


# BADGE
@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("badge_type", "user", "awarded_at")
    list_filter = ("badge_type", "awarded_at")
    search_fields = ("badge_type", "user__email", "user__username")
    readonly_fields = ("awarded_at",)
