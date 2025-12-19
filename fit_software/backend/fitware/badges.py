from rest_framework import serializers, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Badge

# =============================================================================
# SERIALIZERS
# =============================================================================

class BadgeSerializer(serializers.ModelSerializer):
    """Badge serializer for listing and creating badges"""
    
    class Meta:
        model = Badge
        fields = ['badge_type', 'awarded_at']
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

