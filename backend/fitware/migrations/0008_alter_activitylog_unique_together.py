# Generated migration for ActivityLog unique constraint

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('fitware', '0007_profile_profile_picture'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='activitylog',
            unique_together={('user', 'date')},
        ),
    ]
