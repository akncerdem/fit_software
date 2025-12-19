from django.db import models
from django.contrib.auth.models import User
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
import datetime

# =============================================================================
# MODELS
# =============================================================================

class ActivityLog(models.Model):
    """Kullanıcının hangi gün işlem yaptığını tutan tablo"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action_type = models.CharField(max_length=50) # 'create', 'update'
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
            # Sıfıra bölme veya anlamsız değer kontrolü
            if self.start_value == self.target_value:
                return 100.0 if self.current_value == self.target_value else 0.0
            
            # Durum 1: Azaltma (Kilo verme vb.)
            if self.start_value > self.target_value:
                if self.current_value <= self.target_value: return 100.0
                if self.current_value >= self.start_value: return 0.0
                total_diff = self.start_value - self.target_value
                current_diff = self.start_value - self.current_value
                return round((current_diff / total_diff) * 100, 1)
            
            # Durum 2: Artırma (Koşu, Ağırlık vb.)
            else:
                if self.current_value >= self.target_value: return 100.0
                if self.current_value <= self.start_value: return 0.0
                total_diff = self.target_value - self.start_value
                current_diff = self.current_value - self.start_value
                return round((current_diff / total_diff) * 100, 1)
        except Exception:
            # Herhangi bir matematik hatasında sistemi çökertme, 0 döndür
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
        instance.current_value = validated_data['current_value']
        instance.save()
        return instance

# =============================================================================
# VIEWS
# =============================================================================

class GoalViewSet(viewsets.ModelViewSet):
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
            print(f"Log Error: {e}") # Log hatası olsa bile sistemi durdurma

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
        """Son 30 günün aktivite loglarını getir"""
        try:
            user = request.user if request.user.is_authenticated else User.objects.first()
            start_date = timezone.now().date() - datetime.timedelta(days=35)
            logs = ActivityLog.objects.filter(user=user, date__gte=start_date)
            return Response(ActivityLogSerializer(logs, many=True).data)
        except Exception:
            return Response([]) # Hata olursa boş liste dön
