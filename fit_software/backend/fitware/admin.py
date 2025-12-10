from django.contrib import admin
from .models import (
    # Profile,
    Goal,
    # Challenge,
    # ChallengeJoined,
    # Movement,
    # WorkoutLog,
    Badge,
)

# @admin.register(Profile)
# class ProfileAdmin(admin.ModelAdmin):
#     list_display = ("user", "fitness_level", "height", "weight")

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "is_active")#,"due_date", "created_at")
    search_fields = ("title", "user__email", "user__username")

# class ChallengeJoinedInline(admin.TabularInline):
#     model = ChallengeJoined
#     extra = 0

# @admin.register(Challenge)
# class ChallengeAdmin(admin.ModelAdmin):
#     list_display = ("title", "created_user", "created_at")
#     inlines = [ChallengeJoinedInline]

# @admin.register(Movement)
# class MovementAdmin(admin.ModelAdmin):
#     list_display = ("name", "category")

# @admin.register(WorkoutLog)
# class WorkoutLogAdmin(admin.ModelAdmin):
#     list_display = ("title", "user", "date", "created_at")
#     search_fields = ("title", "user__email")

class BadgeAdmin(admin.ModelAdmin):
    list_display = ("badge_type", "user", "awarded_at")
    list_filter = ("badge_type", "awarded_at")
    search_fields = ("badge_type", "user__email", "user__username")
    readonly_fields = ("awarded_at",)

admin.site.register(Badge, BadgeAdmin)   