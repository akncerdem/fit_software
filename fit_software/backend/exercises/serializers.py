from rest_framework import serializers
from .models import Exercise

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        # Add 'description' and 'metric_type' here
        fields = ['id', 'name', 'description', 'category', 'metric_type', 'created_by']
        read_only_fields = ['created_by']