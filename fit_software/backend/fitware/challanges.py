# fitware/challenges.py
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Challenge, ChallengeJoined


class ChallengeSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    days_left = serializers.SerializerMethodField()
    is_joined = serializers.SerializerMethodField()
    badge = serializers.CharField(source="badge_name", read_only=True)

    class Meta:
        model = Challenge
        fields = [
            "id",
            "title",
            "description",
            "badge",
            "participants",
            "days_left",
            "is_joined",
            "created_at",
        ]

    def get_participants(self, obj):
        return obj.challengejoined_set.count()

    def get_days_left(self, obj):
        if not obj.due_date:
            return None
        today = timezone.now().date()
        delta = (obj.due_date - today).days
        return max(delta, 0)

    def get_is_joined(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            return ChallengeJoined.objects.filter(user=user, challenge=obj).exists()
        return False


class ChallengeViewSet(viewsets.ModelViewSet):
    queryset = Challenge.objects.all().order_by("-created_at")
    serializer_class = ChallengeSerializer
    permission_classes = [AllowAny]  # istersen daha sonra IsAuthenticated yaparsın

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def _get_effective_user(self, request):
        """
        Test için: user yoksa ilk kullanıcıyı kullan.
        """
        user = request.user
        if user.is_authenticated:
            return user

        first_user = User.objects.first()
        return first_user

    @action(detail=False, methods=["get"])
    def my(self, request):
        """
        GET /api/challenges/my/  → kullanıcının katıldığı challengelar
        """
        user = self._get_effective_user(request)
        if not user:
            return Response([], status=status.HTTP_200_OK)

        qs = Challenge.objects.filter(challengejoined__user=user).distinct()
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        """
        POST /api/challenges/{id}/join/  → challenge'a katıl
        """
        user = self._get_effective_user(request)
        if not user:
            return Response(
                {"detail": "No user available"}, status=status.HTTP_400_BAD_REQUEST
            )

        challenge = self.get_object()
        ChallengeJoined.objects.get_or_create(user=user, challenge=challenge)
        serializer = self.get_serializer(challenge)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        """
        POST /api/challenges/{id}/leave/  → challenge'dan çık
        """
        user = self._get_effective_user(request)
        if not user:
            return Response(
                {"detail": "No user available"}, status=status.HTTP_400_BAD_REQUEST
            )

        challenge = self.get_object()
        ChallengeJoined.objects.filter(user=user, challenge=challenge).delete()
        serializer = self.get_serializer(challenge)
        return Response(serializer.data)
