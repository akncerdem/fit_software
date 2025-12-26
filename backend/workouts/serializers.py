from rest_framework import serializers
# 1. Update imports to match your new models.py
from .models import WorkoutTemplate, TemplateExercise, WorkoutSession, WorkoutExercise, WorkoutSet

# --- PART A: Template Serializers (Mostly unchanged, just cleaned up) ---
class TemplateExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    category = serializers.CharField(source='exercise.category', read_only=True)
    metric_type = serializers.CharField(source='exercise.metric_type', read_only=True)

    class Meta:
        model = TemplateExercise
        fields = ['id', 'exercise', 'exercise_name', 'category', 'metric_type', 'order', 'sets', 'target_reps']

class WorkoutTemplateSerializer(serializers.ModelSerializer):
    exercises = TemplateExerciseSerializer(source='template_exercises', many=True, read_only=True)
    exercises_data = serializers.ListField(child=serializers.DictField(), write_only=True)
    
    exercise_count = serializers.SerializerMethodField()
    total_sets = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutTemplate
        fields = ['id', 'title', 'description', 'exercises', 'exercises_data', 'is_ai_generated', 
                  'created_at', 'exercise_count', 'total_sets']
        read_only_fields = ['created_at']

    def get_exercise_count(self, obj):
        return obj.template_exercises.count()
    
    def get_total_sets(self, obj):
        return sum(te.sets for te in obj.template_exercises.all())

# workouts/serializers.py

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises_data', [])
        user = self.context['request'].user
        template = WorkoutTemplate.objects.create(user=user, **validated_data)
        
        for ex_data in exercises_data:
            ex_data['exercise_id'] = ex_data.pop('exercise')
            
            # --- FIX STARTS HERE ---
            # Use .pop() to REMOVE 'reps' from ex_data so it doesn't crash the model
            reps_str = ex_data.pop('reps', '0') 
            
            # Logic to convert string "8-12" to integer 8
            if isinstance(reps_str, str) and reps_str:
                first_num = ''.join(filter(str.isdigit, reps_str.split('-')[0]))
                ex_data['target_reps'] = int(first_num) if first_num else 0
            else:
                ex_data['target_reps'] = int(reps_str) if reps_str else 0
            
            # Now ex_data only contains fields that actually exist in the model
            TemplateExercise.objects.create(template=template, **ex_data)
            # --- FIX ENDS HERE ---

        return template

    # workouts/serializers.py inside WorkoutTemplateSerializer

    def update(self, instance, validated_data):
        # 1. Update the main fields (Title, Description)
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.save()

        # 2. Handle Exercises (if the list is included in the update)
        if 'exercises_data' in validated_data:
            exercises_data = validated_data.pop('exercises_data')
            
            # Strategy: Clear all existing exercises and re-create them
            # This handles deleting removed items, adding new ones, and re-ordering automatically.
            instance.template_exercises.all().delete()
            
            for ex_data in exercises_data:
                ex_data['exercise_id'] = ex_data.pop('exercise')
                
                # --- REUSE THE REPS LOGIC FROM CREATE ---
                reps_str = ex_data.pop('reps', '0')
                if isinstance(reps_str, str) and reps_str:
                    first_num = ''.join(filter(str.isdigit, reps_str.split('-')[0]))
                    ex_data['target_reps'] = int(first_num) if first_num else 0
                else:
                    ex_data['target_reps'] = int(reps_str) if reps_str else 0
                
                TemplateExercise.objects.create(template=instance, **ex_data)
                
        return instance

# --- PART B: Session Serializers (NEW STRUCTURE) ---

# Level 3: The individual sets (formerly part of SessionLog)
class WorkoutSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutSet
        fields = ['id', 'set_number', 'weight_kg', 'reps', 'rpe', 'is_completed']

# Level 2: The Exercise container (NEW)
class WorkoutExerciseSerializer(serializers.ModelSerializer):
    # Nest the sets inside here
    sets = WorkoutSetSerializer(many=True, read_only=True)
    
    # Exercise details
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    category = serializers.CharField(source='exercise.category', read_only=True)
    metric_type = serializers.CharField(source='exercise.metric_type', read_only=True)
    
    class Meta:
        model = WorkoutExercise
        fields = ['id', 'exercise', 'exercise_name', 'category', 'metric_type', 'order', 'notes', 'sets']

# Level 1: The Session
class WorkoutSessionSerializer(serializers.ModelSerializer):
    # Nest the exercises inside here (which contain the sets)
    exercises = WorkoutExerciseSerializer(many=True, read_only=True)
    
    formatted_date = serializers.DateTimeField(source='date', format="%Y-%m-%d %H:%M", read_only=True)
    template_title = serializers.CharField(source='template.title', read_only=True, allow_null=True)
    
    # Updated Stats logic for nested structure
    total_exercises = serializers.SerializerMethodField()
    total_sets = serializers.SerializerMethodField()
    total_reps = serializers.SerializerMethodField()
    total_volume = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutSession
        fields = ['id', 'title', 'template', 'template_title', 'date', 'formatted_date', 
                  'duration_minutes', 'mood_emoji', 'notes', 'is_completed', 
                  'exercises', # This matches the related_name in models.py
                  'total_exercises', 'total_sets', 'total_reps', 'total_volume']
    
    def get_total_exercises(self, obj):
        return obj.exercises.count()
    
    def get_total_sets(self, obj):
        # Sum sets across all exercises in this session
        return sum(ex.sets.count() for ex in obj.exercises.all())
    
    def get_total_reps(self, obj):
        # Iterate exercises -> iterate sets -> sum reps
        total = 0
        for ex in obj.exercises.all():
            for s in ex.sets.all():
                total += (s.reps or 0)
        return total
    
    def get_total_volume(self, obj):
        # Iterate exercises -> iterate sets -> sum (weight * reps)
        total = 0
        for ex in obj.exercises.all():
            for s in ex.sets.all():
                total += (s.weight_kg or 0) * (s.reps or 0)
        return total