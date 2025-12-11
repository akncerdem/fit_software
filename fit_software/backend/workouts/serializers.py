from rest_framework import serializers
from .models import WorkoutTemplate, TemplateExercise, WorkoutSession, SessionLog

# --- Template Serializers ---
class TemplateExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    category = serializers.CharField(source='exercise.category', read_only=True)
    metric_type = serializers.CharField(source='exercise.metric_type', read_only=True)

    class Meta:
        model = TemplateExercise
        fields = ['id', 'exercise', 'exercise_name', 'category', 'metric_type', 'order', 'sets', 'reps']

class WorkoutTemplateSerializer(serializers.ModelSerializer):
    exercises = TemplateExerciseSerializer(source='template_exercises', many=True, read_only=True)
    
    # Write-only field to accept exercise IDs when creating a template
    exercises_data = serializers.ListField(child=serializers.DictField(), write_only=True)
    
    # Additional detail fields for frontend
    exercise_count = serializers.SerializerMethodField()
    total_sets = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutTemplate
        fields = ['id', 'title', 'description', 'exercises', 'exercises_data', 'is_ai_generated', 
                  'created_at', 'exercise_count', 'total_sets']
        read_only_fields = ['created_at']

    def get_exercise_count(self, obj):
        """Returns the number of exercises in this template"""
        return obj.template_exercises.count()
    
    def get_total_sets(self, obj):
        """Returns the total number of sets across all exercises"""
        return sum(te.sets for te in obj.template_exercises.all())

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises_data', [])
        # The user needs to be associated with the template itself
        user = self.context['request'].user
        template = WorkoutTemplate.objects.create(user=user, **validated_data)
        
        for ex_data in exercises_data:
            # The frontend sends `exercise: ID`, but the model needs `exercise_id=ID`
            ex_data['exercise_id'] = ex_data.pop('exercise')
            TemplateExercise.objects.create(template=template, **ex_data)
        return template

# --- Session Serializers ---
class SessionLogSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    category = serializers.CharField(source='exercise.category', read_only=True)
    metric_type = serializers.CharField(source='exercise.metric_type', read_only=True)
    
    class Meta:
        model = SessionLog
        fields = ['id', 'exercise', 'exercise_name', 'category', 'metric_type', 'set_number', 'weight_kg', 'reps']

class WorkoutSessionSerializer(serializers.ModelSerializer):
    logs = SessionLogSerializer(many=True, read_only=True)
    formatted_date = serializers.DateTimeField(source='date', format="%Y-%m-%d %H:%M", read_only=True)
    template_title = serializers.CharField(source='template.title', read_only=True, allow_null=True)
    
    # Summary statistics for frontend
    total_exercises = serializers.SerializerMethodField()
    total_sets = serializers.SerializerMethodField()
    total_reps = serializers.SerializerMethodField()
    total_volume = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutSession
        fields = ['id', 'title', 'template', 'template_title', 'date', 'formatted_date', 
                  'duration_minutes', 'mood_emoji', 'notes', 'is_completed', 'logs',
                  'total_exercises', 'total_sets', 'total_reps', 'total_volume']
    
    def get_total_exercises(self, obj):
        """Returns number of unique exercises in this session"""
        return obj.logs.values('exercise').distinct().count()
    
    def get_total_sets(self, obj):
        """Returns total number of sets logged"""
        return obj.logs.count()
    
    def get_total_reps(self, obj):
        """Returns total reps across all sets"""
        return sum(log.reps or 0 for log in obj.logs.all())
    
    def get_total_volume(self, obj):
        """Returns total volume (weight * reps) for strength exercises"""
        return sum((log.weight_kg or 0) * (log.reps or 0) for log in obj.logs.all())