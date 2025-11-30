import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Profile

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_profile(request):
    """Create a profile for the authenticated user."""
    try:
        # Check if profile already exists
        try:
            Profile.objects.get(user=request.user)
            return Response(
                {"error": "Profile already exists. Use update endpoint to modify it."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Profile.DoesNotExist:
            pass
        
        data = request.data
        
        profile = Profile.objects.create(
            user=request.user,
            photo_url=data.get("photo_url", "").strip(),
            bio=data.get("bio", "").strip(),
            fitness_level=data.get("fitness_level", "").strip(),
            height=data.get("height") if data.get("height") is not None else None,
            weight=data.get("weight") if data.get("weight") is not None else None,
        )
        
        return Response(
            {
                "message": "Profile created successfully.",
                "profile": {
                    "id": profile.id,
                    "photo_url": profile.photo_url,
                    "bio": profile.bio,
                    "fitness_level": profile.fitness_level,
                    "height": profile.height,
                    "weight": profile.weight,
                },
            },
            status=status.HTTP_201_CREATED,
        )
    
    except Exception as exc:
        logger.exception("Create profile failed: %s", exc)
        return Response(
            {"error": "Unexpected error during profile creation."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update the authenticated user's profile."""
    try:
        try:
            profile = Profile.objects.get(user=request.user)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found. Use create endpoint to create one."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        data = request.data
        
        if "photo_url" in data:
            profile.photo_url = data.get("photo_url", "").strip()
        
        if "bio" in data:
            profile.bio = data.get("bio", "").strip()
        
        if "fitness_level" in data:
            profile.fitness_level = data.get("fitness_level", "").strip()
        
        if "height" in data:
            profile.height = data.get("height") if data.get("height") is not None else None
        
        if "weight" in data:
            profile.weight = data.get("weight") if data.get("weight") is not None else None
        
        profile.save()
        
        return Response(
            {
                "message": "Profile updated successfully.",
                "profile": {
                    "id": profile.id,
                    "photo_url": profile.photo_url,
                    "bio": profile.bio,
                    "fitness_level": profile.fitness_level,
                    "height": profile.height,
                    "weight": profile.weight,
                },
            },
            status=status.HTTP_200_OK,
        )
    
    except Exception as exc:
        logger.exception("Update profile failed: %s", exc)
        return Response(
            {"error": "Unexpected error during profile update."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

