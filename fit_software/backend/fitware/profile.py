from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .models import Profile

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
    
    def list(self, request, *args, **kwargs):
        """Override list to return single profile or create one"""
        profile = Profile.objects.filter(user=request.user).first()
        if profile:
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        else:
            # Return empty response if no profile exists
            return Response(None, status=status.HTTP_404_NOT_FOUND)
    
    def perform_create(self, serializer):
        """Create profile and assign to current user"""
        # Check if profile already exists
        if Profile.objects.filter(user=self.request.user).exists():
            raise serializers.ValidationError("Profile already exists for this user. Use PUT/PATCH to update.")
        serializer.save(user=self.request.user)
    
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

