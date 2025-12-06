from django.db import models
from django.contrib.auth.models import User
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

# =============================================================================
# MODELS
# =============================================================================

class Goal(models.Model):
    """Kullanıcı hedefleri modeli"""
    
    UNIT_CHOICES = [
        ('kg', 'Kilogram'),
        ('workouts', 'Workouts'),
        ('km', 'Kilometer'),
        ('reps', 'Repetitions'),
        ('minutes', 'Minutes'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default='🎯')
    
    start_value = models.FloatField(default=0)
    current_value = models.FloatField(default=0)
    target_value = models.FloatField()
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='workouts')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    @property
    def progress(self):
        """İlerleme yüzdesini hesapla"""
        if self.target_value == 0:
            return 0
        if self.icon == '📉':
            return min(round((self.target_value/self.current_value ) * 100, 1), 100)
        else:
            return min(round((self.current_value / self.target_value) * 100, 1), 100)
    
    @property
    def remaining(self):
        """
        Hedefe kalan miktarı hedefin yönüne göre hesapla.
        """
        try:
            # Durum 1: Kilo Verme / Azaltma (Start > Target)
            # Örn: Start: 80, Target: 75, Current: 78
            if self.start_value > self.target_value:
                # Eğer hedefin altına inildiyse kalan 0'dır
                if self.current_value <= self.target_value:
                    return 0
                # Kalan = Güncel - Hedef (78 - 75 = 3 kg kaldı)
                return round(self.current_value - self.target_value, 1)

            # Durum 2: Kilo Alma / Artırma (Target > Start)
            # Örn: Start: 50, Target: 60, Current: 55
            else:
                # Hedef geçildiyse kalan 0'dır
                if self.current_value >= self.target_value:
                    return 0
                # Kalan = Hedef - Güncel (60 - 55 = 5 kg kaldı)
                return round(self.target_value - self.current_value, 1)
                
        except Exception:
            return 0


# =============================================================================
# SERIALIZERS
# =============================================================================

class GoalSerializer(serializers.ModelSerializer):
    """Goal serializer"""
    
    progress = serializers.ReadOnlyField()
    remaining = serializers.ReadOnlyField()
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Goal
        fields = [
            'id', 'user', 'username', 'title', 'description', 'icon',
            'start_value', 'current_value', 'target_value', 'unit', 'progress', 'remaining',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Yeni goal oluştururken user'ı otomatik ekle"""
        # Eğer request context'te varsa user'ı al
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['user'] = request.user
        else:
            # Test için ilk user'ı kullan
            validated_data['user'] = User.objects.first()
            
        # start_value'yu current_value ile başlat (eğer verilmediyse)
        if 'start_value' not in validated_data:
            validated_data['start_value'] = validated_data.get('current_value', 0)
            
        return super().create(validated_data)


class GoalUpdateProgressSerializer(serializers.Serializer):
    """Goal progress güncelleme serializer"""
    
    current_value = serializers.FloatField(min_value=0)
    
    def update(self, instance, validated_data):
        instance.current_value = validated_data['current_value']
        instance.save()
        return instance


# =============================================================================
# VIEWS
# =============================================================================

class GoalViewSet(viewsets.ModelViewSet):
    """
    Goal ViewSet - CRUD işlemleri
    
    Endpoints:
    - GET /api/goals/ - Tüm goals listesi
    - POST /api/goals/ - Yeni goal oluştur
    - GET /api/goals/{id}/ - Tek goal detayı
    - PUT /api/goals/{id}/ - Goal güncelle
    - PATCH /api/goals/{id}/ - Goal kısmi güncelle
    - DELETE /api/goals/{id}/ - Goal sil
    - POST /api/goals/{id}/update_progress/ - Progress güncelle
    """
    
    serializer_class = GoalSerializer
    # TEST İÇİN - Production'da IsAuthenticated olmalı
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Sadece kullanıcının kendi goal'larını getir"""
        # TEST İÇİN - Kullanıcı kontrolü kaldırıldı
        if self.request.user.is_authenticated:
            return Goal.objects.filter(user=self.request.user)
        # Giriş yapmamış kullanıcı için tüm goal'ları göster (TEST İÇİN)
        return Goal.objects.all()
    
    def perform_create(self, serializer):
        """Yeni goal oluştururken user'ı otomatik ekle"""
        # TEST İÇİN - Kullanıcı kontrolü esnetildi
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            # Test için ilk user'ı kullan
            first_user = User.objects.first()
            if first_user:
                serializer.save(user=first_user)
            else:
                # Hiç user yoksa hata ver
                raise serializers.ValidationError("No users exist in database")
    
    @action(detail=True, methods=['post'], url_path='update-progress')
    def update_progress(self, request, pk=None):
        """
        Goal progress güncelle
        
        POST /api/goals/{id}/update-progress/
        Body: { "current_value": 5.5 }
        """
        goal = self.get_object()
        serializer = GoalUpdateProgressSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.update(goal, serializer.validated_data)
            return Response({
                'success': True,
                'message': 'Progress updated successfully',
                'goal': GoalSerializer(goal).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Sadece aktif goal'ları getir
        
        GET /api/goals/active/
        """
        active_goals = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_goals, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Goal istatistikleri
        
        GET /api/goals/stats/
        """
        queryset = self.get_queryset()
        total_goals = queryset.count()
        active_goals = queryset.filter(is_active=True).count()
        completed_goals = queryset.filter(
            current_value__gte=models.F('target_value')
        ).count()
        
        return Response({
            'total_goals': total_goals,
            'active_goals': active_goals,
            'completed_goals': completed_goals,
            'completion_rate': round((completed_goals / total_goals * 100) if total_goals > 0 else 0, 1)
        })