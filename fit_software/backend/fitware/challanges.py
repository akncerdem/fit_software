# fitware/challanges.py
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Challenge, ChallengeJoined
from .goals import Goal


class ChallengeSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    days_left = serializers.SerializerMethodField()
    is_joined = serializers.SerializerMethodField()

    # badge_name alanını frontend'de "badge" diye kullanıyoruz
    badge = serializers.CharField(
        source="badge_name",
        required=False,
        allow_blank=True,
    )

    # Kullanıcıya özel progress alanları
    progress_value = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = [
            "id",
            "title",
            "description",
            "badge",
            "due_date",          # bitiş tarihi
            "participants",
            "days_left",
            "is_joined",
            "target_value",      # hedef (örn. 20 km, 10 workout vs.)
            "unit",              # km, workout, kg...
            "progress_value",
            "progress_percent",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "participants",
            "days_left",
            "is_joined",
            "progress_value",
            "progress_percent",
            "created_at",
        ]

    # ---- yardımcı metodlar ----
    def _get_user(self):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            return user
        return None

    def _get_joined_obj(self, obj):
        user = self._get_user()
        if not user:
            return None
        return ChallengeJoined.objects.filter(user=user, challenge=obj).first()

    def get_participants(self, obj):
        return obj.challengejoined_set.count()

    def get_days_left(self, obj):
        if not obj.due_date:
            return None
        today = timezone.now().date()
        delta = (obj.due_date - today).days
        return max(delta, 0)

    def get_is_joined(self, obj):
        return self._get_joined_obj(obj) is not None

    def get_progress_value(self, obj):
        cj = self._get_joined_obj(obj)
        return cj.progress_value if cj else 0

    def get_progress_percent(self, obj):
        cj = self._get_joined_obj(obj)
        return cj.progress_percent if cj else 0


class ChallengeProgressSerializer(serializers.Serializer):
    progress_value = serializers.FloatField(min_value=0)

    def update(self, instance, validated_data):
        instance.progress_value = validated_data["progress_value"]

        # Yüzdeyi hesapla (challenge hedefi varsa)
        challenge = instance.challenge
        if getattr(challenge, "target_value", None):
            instance.progress_percent = min(
                100,
                (instance.progress_value / challenge.target_value) * 100,
            )

        instance.save()
        return instance


class ChallengeViewSet(viewsets.ModelViewSet):
    queryset = Challenge.objects.all().order_by("-created_at")
    serializer_class = ChallengeSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def _get_effective_user(self, request):
        """
        Test için: user yoksa ilk kullanıcıyı kullan.
        Prod'da sadece request.user kullanırsın.
        """
        user = request.user
        if user.is_authenticated:
            return user
        return User.objects.first()

    # 🔹 ÖNEMLİ: Challenge create ederken created_user'ı doldur
    # ve otomatik olarak o challenge'a join et
    def perform_create(self, serializer):
        """
        Challenge yaratılırken:
        1) Kullanıcı için bir Goal oluştur
        2) Challenge.goal = o goal yap
        3) Challenge'ı oluşturan kişiyi otomatik join et
        """
        user = self._get_effective_user(self.request)
        if not user:
            raise serializers.ValidationError("No user available")

        # serializer.validated_data içinden alanları al
        data = serializer.validated_data

        # 1) Goal oluştur
        goal = Goal.objects.create(
            user=user,
            title=data.get("title", ""),
            description=data.get("description", ""),
            target_value=data.get("target_value"),
            unit=data.get("unit") or "workouts",
            # start_value ve current_value default 0, is_active default True
            is_completed=False,
        )

        # 2) Challenge'ı oluştur ve ona goal'i bağla
        challenge = serializer.save(
            created_user=user,
            goal=goal,
        )

        # 3) Oluşturan kişiyi otomatik olarak challenge'a join et
        ChallengeJoined.objects.get_or_create(user=user, challenge=challenge)

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
                {"detail": "No user available"},
                status=status.HTTP_400_BAD_REQUEST,
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
                {"detail": "No user available"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        challenge = self.get_object()
        ChallengeJoined.objects.filter(user=user, challenge=challenge).delete()
        serializer = self.get_serializer(challenge)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="update-progress")
    def update_progress(self, request, pk=None):
        """
        POST /api/challenges/{id}/update-progress/
        Body: { "progress_value": 12.5 }
        """
        user = self._get_effective_user(request)
        if not user:
            return Response(
                {"detail": "No user available"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        challenge = self.get_object()
        joined, _ = ChallengeJoined.objects.get_or_create(
            user=user, challenge=challenge
        )

        serializer = ChallengeProgressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.update(joined, serializer.validated_data)
            out = self.get_serializer(challenge)
            return Response(out.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
