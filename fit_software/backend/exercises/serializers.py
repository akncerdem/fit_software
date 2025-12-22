from rest_framework import serializers
from .models import Exercise

class ExerciseSerializer(serializers.ModelSerializer):
    # Add a readable field to indicate if it's a global or custom exercise
    is_custom = serializers.SerializerMethodField()
    
    class Meta:
        model = Exercise
        fields = ['id', 'name', 'category', 'metric_type', 'created_by', 'is_custom']
        read_only_fields = ['created_by']
    
    def get_is_custom(self, obj):
        """Returns True if this is a custom exercise (created by a user)"""
        return obj.created_by is not None