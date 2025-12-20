from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .models import Profile
from .goals import Goal

# =============================================================================
# SERIALIZERS
# =============================================================================

class ProfileSerializer(serializers.ModelSerializer):
    """Profile serializer for CRUD operations"""
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'user_id', 'bio', 'fitness_level', 'height', 'weight']
        read_only_fields = ['id', 'user_id']

# =============================================================================
# VIEWS
# =============================================================================

class ProfileViewSet(viewsets.ModelViewSet):
    """
    Profile ViewSet - CRUD operations
    
    Endpoints:
    - GET /api/profile/ - Get current user's profile
    - POST /api/profile/ - Create profile for current user
    - GET /api/profile/{id}/ - Get profile by id (own profile only)
    - PUT /api/profile/{id}/ - Update profile
    - PATCH /api/profile/{id}/ - Partial update profile
    """
    
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only return the current user's profile"""
        return Profile.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create profile for current user"""
        # Check if user already has a profile
        if Profile.objects.filter(user=request.user).exists():
            return Response(
                {"detail": "Profile already exists for this user."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create profile with current user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def list(self, request, *args, **kwargs):
        """Override list to return single profile or create one"""
        profile = Profile.objects.filter(user=request.user).first()
        if profile:
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        else:
            # Return empty response if no profile exists
            return Response(None, status=status.HTTP_404_NOT_FOUND)
    
    def perform_update(self, serializer):
        """Update profile and sync weight to related goals"""
        old_weight = serializer.instance.weight
        super().perform_update(serializer)
        
        # Check if weight was updated
        new_weight = serializer.instance.weight
        if old_weight != new_weight and new_weight is not None:
            self._sync_weight_to_goals(serializer.instance.user, new_weight)
    
    def _sync_weight_to_goals(self, user, new_weight):
        """Sync profile weight to active weight-related goals"""
        # Weight-related units
        weight_units = ['kg', 'lbs']
        
        # Update current_value for active goals with weight units
        active_weight_goals = Goal.objects.filter(
            user=user,
            is_active=True,
            unit__in=weight_units
        )
        
        for goal in active_weight_goals:
            goal.current_value = new_weight
            goal.save()
    
    def update(self, request, *args, **kwargs):
        """Update existing profile"""
        instance = self.get_object()
        # Ensure user can only update their own profile
        if instance.user != request.user:
            return Response(
                {"detail": "You can only update your own profile."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update existing profile"""
        instance = self.get_object()
        # Ensure user can only update their own profile
        if instance.user != request.user:
            return Response(
                {"detail": "You can only update your own profile."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

