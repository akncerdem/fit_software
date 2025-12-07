from rest_framework import serializers
from .models import WorkoutTemplate, TemplateExercise, WorkoutSession, SessionLog

# --- Template Serializers ---
class TemplateExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    category = serializers.CharField(source='exercise.category', read_only=True)

    class Meta:
        model = TemplateExercise
        fields = ['id', 'exercise', 'exercise_name', 'category', 'order', 'sets', 'reps']

class WorkoutTemplateSerializer(serializers.ModelSerializer):
    exercises = TemplateExerciseSerializer(source='template_exercises', many=True, read_only=True)
    
    # Write-only field to accept exercise IDs when creating a template
    exercises_data = serializers.ListField(child=serializers.DictField(), write_only=True)

    class Meta:
        model = WorkoutTemplate
        fields = ['id', 'title', 'description', 'exercises', 'exercises_data', 'is_ai_generated']

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises_data', [])
        template = WorkoutTemplate.objects.create(**validated_data)
        
        for ex_data in exercises_data:
            TemplateExercise.objects.create(template=template, **ex_data)
        return template

# --- Session Serializers ---
class SessionLogSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    
    class Meta:
        model = SessionLog
        fields = ['id', 'exercise', 'exercise_name', 'set_number', 'weight_kg', 'reps']

class WorkoutSessionSerializer(serializers.ModelSerializer):
    logs = SessionLogSerializer(many=True, read_only=True)
    formatted_date = serializers.DateTimeField(source='date', format="%Y-%m-%d %H:%M", read_only=True)

    class Meta:
        model = WorkoutSession
        fields = ['id', 'title', 'formatted_date', 'duration_minutes', 'is_completed', 'logs']