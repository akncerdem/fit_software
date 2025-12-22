from rest_framework import serializers, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Badge

# =============================================================================
# SERVICES
# =============================================================================

class BadgeService:
    """Service for handling badge awarding logic with milestone achievements"""
    
    # Milestone badge definitions with creative names and emojis
    MILESTONE_BADGES = {
        'goal_5': {
            'name': '🎯 Goal Crusher',
            'description': 'Complete 5 goals'
        },
        'goal_10': {
            'name': '⭐ Goal Master',
            'description': 'Complete 10 goals'
        },
        'goal_15': {
            'name': '🏆 Goal Legend',
            'description': 'Complete 15 goals'
        },
        'goal_20': {
            'name': '👑 Goal Champion',
            'description': 'Complete 20 goals'
        },
        'challenge_1': {
            'name': '🎪 Challenge Taker',
            'description': 'Complete 1 challenge'
        },
        'challenge_5': {
            'name': '🔥 Challenge Warrior',
            'description': 'Complete 5 challenges'
        },
        'challenge_10': {
            'name': '⚡ Challenge Legend',
            'description': 'Complete 10 challenges'
        },
        'workout_5': {
            'name': '💪 Workout Warrior',
            'description': 'Complete 5 workouts'
        },
        'workout_10': {
            'name': '🏋️ Iron Beast',
            'description': 'Complete 10 workouts'
        },
        'workout_25': {
            'name': '🚀 Fitness Rocket',
            'description': 'Complete 25 workouts'
        },
        'workout_50': {
            'name': '🌟 Gym Legend',
            'description': 'Complete 50 workouts'
        },
    }
    
    @staticmethod
    def check_milestone_badges(user):
        """Check and award milestone badges for completed goals, challenges, and workouts"""
        from .models import Goal, ChallengeJoined, Badge
        
        # Count completed goals
        completed_goals = Goal.objects.filter(user=user, is_completed=True).count()
        
        # Award goal milestones (every 5 goals)
        goal_milestones = [5, 10, 15, 20]
        for milestone in goal_milestones:
            if completed_goals >= milestone:
                badge_key = f'goal_{milestone}'
                badge_info = BadgeService.MILESTONE_BADGES.get(badge_key)
                if badge_info and not Badge.objects.filter(user=user, badge_type=badge_info['name']).exists():
                    Badge.objects.create(user=user, badge_type=badge_info['name'])
        
        # Count completed challenges
        completed_challenges = ChallengeJoined.objects.filter(user=user, is_completed=True).count()
        
        # Award challenge milestones (every challenge)
        if completed_challenges >= 1:
            badge_info = BadgeService.MILESTONE_BADGES.get('challenge_1')
            if badge_info and not Badge.objects.filter(user=user, badge_type=badge_info['name']).exists():
                Badge.objects.create(user=user, badge_type=badge_info['name'])
        
        if completed_challenges >= 5:
            badge_info = BadgeService.MILESTONE_BADGES.get('challenge_5')
            if badge_info and not Badge.objects.filter(user=user, badge_type=badge_info['name']).exists():
                Badge.objects.create(user=user, badge_type=badge_info['name'])
        
        if completed_challenges >= 10:
            badge_info = BadgeService.MILESTONE_BADGES.get('challenge_10')
            if badge_info and not Badge.objects.filter(user=user, badge_type=badge_info['name']).exists():
                Badge.objects.create(user=user, badge_type=badge_info['name'])
        
        # Count completed workouts
        try:
            from workouts.models import WorkoutSession
            completed_workouts = WorkoutSession.objects.filter(user=user, is_completed=True).count()
        except (ImportError, Exception):
            completed_workouts = 0
        
        # Award workout milestones (every 5 workouts)
        workout_milestones = [5, 10, 25, 50]
        for milestone in workout_milestones:
            if completed_workouts >= milestone:
                badge_key = f'workout_{milestone}'
                badge_info = BadgeService.MILESTONE_BADGES.get(badge_key)
                if badge_info and not Badge.objects.filter(user=user, badge_type=badge_info['name']).exists():
                    Badge.objects.create(user=user, badge_type=badge_info['name'])

# =============================================================================
# SERIALIZERS
# =============================================================================

class BadgeSerializer(serializers.ModelSerializer):
    """Badge serializer for listing and creating badges"""
    
    class Meta:
        model = Badge
        fields = ['id', 'badge_type', 'awarded_at']
        read_only_fields = ['awarded_at']

# =============================================================================
# VIEWS
# =============================================================================

class BadgeViewSet(viewsets.ModelViewSet):
    """
    Badge ViewSet - CRUD operations
    
    Endpoints:
    - GET /api/badges/ - Get all badges for the current authenticated user
    - POST /api/badges/ - Create a new badge for the current authenticated user
    """
    
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only return badges that belong to the current user"""
        return Badge.objects.filter(user=self.request.user).order_by('-awarded_at')
    
    def list(self, request, *args, **kwargs):
        """Override list to return badges for current user"""
        badges = self.get_queryset()
        serializer = self.get_serializer(badges, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Create badge and assign to current user"""
        serializer.save(user=self.request.user)

