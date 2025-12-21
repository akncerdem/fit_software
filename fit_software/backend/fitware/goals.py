from django.db import models
from django.contrib.auth.models import User
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
import datetime
import re
import os
import json
import requests

# =============================================================================
# MODELS
# =============================================================================

class ActivityLog(models.Model):
    """Kullanıcının hangi gün işlem yaptığını tutan tablo"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action_type = models.CharField(max_length=50)  # 'create', 'update'
    date = models.DateField(default=timezone.now)

    class Meta:
        ordering = ['-date']


class Goal(models.Model):
    UNIT_CHOICES = [
        ('kg', 'kg'), ('lbs', 'lbs'), ('fav', 'Body Fat %'),
        ('km', 'Kilometers'), ('m', 'Meters'), ('miles', 'Miles'), ('laps', 'Laps'),
        ('min', 'Minutes'), ('hr', 'Hours'),
        ('workouts', 'Workouts'), ('sets', 'Sets'), ('reps', 'Reps'),
        ('cal', 'Calories')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default='🎯')

    # Progress hesabı için gerekli alanlar
    start_value = models.FloatField(default=0)
    current_value = models.FloatField(default=0)
    target_value = models.FloatField()
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='workouts')

    is_completed = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Yeni kayıtsa ve start_value 0 ise, başlangıç değerini current yap
        if not self.pk and self.start_value == 0:
            self.start_value = self.current_value
        super().save(*args, **kwargs)

    @property
    def progress(self):
        """Hata korumalı progress hesabı"""
        try:
            if self.start_value == self.target_value:
                return 100.0 if self.current_value == self.target_value else 0.0

            # Durum 1: Azaltma (Kilo verme vb.)
            if self.start_value > self.target_value:
                if self.current_value <= self.target_value:
                    return 100.0
                if self.current_value >= self.start_value:
                    return 0.0
                total_diff = self.start_value - self.target_value
                current_diff = self.start_value - self.current_value
                return round((current_diff / total_diff) * 100, 1)

            # Durum 2: Artırma (Koşu, Ağırlık vb.)
            else:
                if self.current_value >= self.target_value:
                    return 100.0
                if self.current_value <= self.start_value:
                    return 0.0
                total_diff = self.target_value - self.start_value
                current_diff = self.current_value - self.start_value
                return round((current_diff / total_diff) * 100, 1)

        except Exception:
            return 0.0

    @property
    def remaining(self):
        return round(abs(self.target_value - self.current_value), 1)


# =============================================================================
# SERIALIZERS
# =============================================================================

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = ['id', 'action_type', 'date']


class GoalSerializer(serializers.ModelSerializer):
    progress = serializers.ReadOnlyField()
    remaining = serializers.ReadOnlyField()
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Goal
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at', 'progress', 'remaining']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['user'] = request.user
        else:
            validated_data['user'] = User.objects.first()

        # start_value kontrolü
        if 'start_value' not in validated_data and 'current_value' in validated_data:
            validated_data['start_value'] = validated_data['current_value']

        return super().create(validated_data)


class GoalUpdateProgressSerializer(serializers.Serializer):
    current_value = serializers.FloatField(min_value=0)

    def update(self, instance, validated_data):
        old_current_value = instance.current_value
        instance.current_value = validated_data['current_value']
        
        # Update profile weight for weight-related goals
        if instance.unit in ['kg', 'lbs']:
            from .models import Profile
            try:
                profile = Profile.objects.get(user=instance.user)
                # Convert lbs to kg if needed
                weight_in_kg = instance.current_value
                if instance.unit == 'lbs':
                    weight_in_kg = instance.current_value * 0.453592  # lbs to kg conversion
                
                profile.weight = weight_in_kg
                profile.save()
            except Profile.DoesNotExist:
                # Create profile if it doesn't exist
                Profile.objects.create(user=instance.user, weight=weight_in_kg if instance.unit == 'kg' else instance.current_value * 0.453592)
        
        # Check if goal is completed
        if not instance.is_completed and instance.is_completed:
            instance.is_completed = True
            # Award badge for goal completion
            from .badges import BadgeService
            BadgeService.award_goal_completion_badge(instance.user, instance)
        
        instance.save()

        # 2) Bu goal'e bağlı tüm challenge'ları bul ve goal sahibinin join kaydını güncelle
        try:
            # Challenge.goal -> related_name="challenges" dedik
            for ch in getattr(instance, "challenges", []).all():
                cj = ch.challengejoined_set.filter(user=instance.user).first()
                if cj:
                    cj.progress_value = value
                    if ch.target_value and value >= ch.target_value:
                        cj.is_completed = True
                    cj.save()
        except Exception as e:
            print("Sync challenge progress failed:", e)

        return instance


# =============================================================================
# VIEWS
# =============================================================================

class GoalViewSet(viewsets.ModelViewSet):
    # Ek sağlamlaştırma: /goals/suggest/ gibi stringler pk sanılmasın
    lookup_value_regex = r"\d+"

    serializer_class = GoalSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Goal.objects.filter(user=self.request.user)
        return Goal.objects.all()

    # Log kaydetme yardımcısı
    def _log_activity(self, action_type):
        try:
            user = self.request.user if self.request.user.is_authenticated else User.objects.first()
            today = timezone.now().date()
            if not ActivityLog.objects.filter(user=user, date=today).exists():
                ActivityLog.objects.create(user=user, action_type=action_type, date=today)
        except Exception as e:
            print(f"Log Error: {e}")  # Log hatası olsa bile sistemi durdurma

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save(user=User.objects.first())
        self._log_activity('create_goal')

    @action(detail=True, methods=['post'], url_path='update-progress')
    def update_progress(self, request, pk=None):
        goal = self.get_object()
        serializer = GoalUpdateProgressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.update(goal, serializer.validated_data)
            self._log_activity('update_progress')
            return Response({'success': True, 'goal': GoalSerializer(goal).data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def active(self, request):
        active_goals = self.get_queryset().filter(is_active=True)
        return Response(self.get_serializer(active_goals, many=True).data)

    @action(detail=False, methods=['get'])
    def activity_logs(self, request):
        """Son 30+ günün aktivite loglarını getir"""
        try:
            user = request.user if request.user.is_authenticated else User.objects.first()
            start_date = timezone.now().date() - datetime.timedelta(days=35)
            logs = ActivityLog.objects.filter(user=user, date__gte=start_date)
            return Response(ActivityLogSerializer(logs, many=True).data)
        except Exception:
            return Response([])  # Hata olursa boş liste dön

    @action(detail=False, methods=['post'], url_path='suggest')
    def suggest(self, request):
        """
        Returns a suggestion for a goal based on the title/description.

        - If the title looks meaningless (only random chars / only numbers / only symbols),
          returns: recognized=False, alternative=None.
        - Otherwise, if GROQ_API_KEY is set, it tries Groq LLM first.
        - If Groq fails / key missing, it falls back to keyword-based suggestions.
        """
        title_raw = (request.data.get("title") or "").strip()
        desc_raw = (request.data.get("description") or "").strip()

        title = title_raw.lower()
        desc = desc_raw.lower()
        combined = f"{title} {desc}".strip()

        # ---- Unknown / meaningless title detection ----
        def is_unknown_goal(t: str) -> bool:
            t = (t or "").strip()
            if len(t) < 3:
                return True

            # At least one letter (not only numbers/symbols)
            if not re.search(r"[a-zA-ZçğıöşüÇĞİÖŞÜ]", t):
                return True

            # "aaaaa", "11111", "....." (same char repeated)
            if re.fullmatch(r"(.)\1{3,}", t):
                return True

            tl = t.lower()

            # Long consonant streak -> likely gibberish (e.g., 'ldhfznb')
            if re.search(r"[bcçdfgğhjklmnprsştvyz]{5,}", tl):
                return True

            # Very low vowel ratio -> likely gibberish for longer words
            letters = re.findall(r"[a-zA-ZçğıöşüÇĞİÖŞÜ]", t)
            if len(letters) >= 6:
                vowels = set(list("aeiouöüı" + "AEIOUÖÜİ"))
                vowel_count = sum(1 for ch in letters if ch in vowels)
                if (vowel_count / len(letters)) < 0.28:
                    return True

            # Very short 1-word weird inputs (asdf, qwer, etc.)
            keywords = [
                "run", "jog", "swim", "cycle", "bike", "workout", "gym",
                "lose", "gain", "calorie", "cardio", "weight", "walk"
            ]
            if len(t.split()) == 1 and len(t) <= 4 and not any(k in tl for k in keywords):
                return True

            return False

        if is_unknown_goal(title_raw):
            return Response({
                "recognized": False,
                "message": "Unknown goal. Please provide a clear description of your fitness goal.",
                "alternative": None
            }, status=status.HTTP_200_OK)

        # ---- Try Groq (OpenAI-compatible) if API key exists ----
        def try_groq_suggestion(title_text: str, desc_text: str):
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                return None

            model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
            url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1/chat/completions")

            system_msg = (
                "You are a fitness goal assistant. Given a user's goal title and description, "
                "generate ONE realistic, measurable goal suggestion. "
                "Return STRICT JSON only (no markdown) with keys: "
                "icon (string emoji), type (string), unit (string), target_value (number), "
                "timeline_days (integer), message (string). "
                "If the input is unclear, still return a safe generic suggestion."
            )

            user_msg = f"Title: {title_text}\nDescription: {desc_text}\n"

            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg}
                ],
                "temperature": 0.4
            }

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            try:
                resp = requests.post(url, headers=headers, json=payload, timeout=12)
                if resp.status_code != 200:
                    return None

                data = resp.json()
                content = (
                    data.get("choices", [{}])[0]
                        .get("message", {})
                        .get("content", "")
                        .strip()
                )
                if not content:
                    return None

                # Try to extract JSON if model added extra text
                # 1) remove code fences if present
                content = re.sub(r"^```(?:json)?\s*", "", content)
                content = re.sub(r"\s*```$", "", content).strip()

                # 2) If still has surrounding text, try to grab first JSON object
                m = re.search(r"\{.*\}", content, flags=re.DOTALL)
                if m:
                    content = m.group(0)

                obj = json.loads(content)

                # Validate required fields
                alt = {
                    "icon": str(obj.get("icon", "🎯"))[:10],
                    "type": str(obj.get("type", "Workout"))[:50],
                    "unit": str(obj.get("unit", "min"))[:20],
                    "target_value": float(obj.get("target_value", 30)),
                    "timeline_days": int(float(obj.get("timeline_days", 7))),
                }
                msg = str(obj.get("message", "Suggestion generated based on your title/description."))

                # Basic sanity
                if alt["timeline_days"] <= 0:
                    alt["timeline_days"] = 7
                if alt["target_value"] <= 0:
                    alt["target_value"] = 30

                return {"message": msg, "alternative": alt}
            except Exception:
                return None

        groq_result = try_groq_suggestion(title_raw, desc_raw)
        if groq_result:
            return Response({
                "recognized": True,
                "message": groq_result["message"],
                "alternative": groq_result["alternative"]
            }, status=status.HTTP_200_OK)

        # ---- Keyword-based suggestion (fallback) ----
        icon = "💪"
        gtype = "Workout"
        unit = "min"
        target_value = 30
        timeline_days = 7

        if any(k in combined for k in ["run", "jog", "5k", "10k"]):
            icon, gtype, unit, target_value, timeline_days = "🏃", "Running", "km", 5, 7
        elif any(k in combined for k in ["cycle", "bike", "cycling"]):
            icon, gtype, unit, target_value, timeline_days = "🚲", "Cycling", "km", 20, 7
        elif any(k in combined for k in ["swim", "swimming"]):
            icon, gtype, unit, target_value, timeline_days = "🏊", "Swimming", "laps", 20, 7
        elif any(k in combined for k in ["lose", "weight loss", "fat", "slim"]):
            icon, gtype, unit, target_value, timeline_days = "📉", "Weight Loss", "kg", 2, 14
        elif any(k in combined for k in ["gain", "bulk", "weight gain"]):
            icon, gtype, unit, target_value, timeline_days = "📈", "Weight Gain", "kg", 2, 30
        elif any(k in combined for k in ["calorie", "burn", "cardio"]):
            icon, gtype, unit, target_value, timeline_days = "🔥", "Cardio", "cal", 200, 7

        return Response({
            "recognized": True,
            "message": "Suggestion generated based on your title/description.",
            "alternative": {
                "icon": icon,
                "type": gtype,
                "unit": unit,
                "target_value": target_value,
                "timeline_days": timeline_days
            }
        }, status=status.HTTP_200_OK)
