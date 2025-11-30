import logging
from datetime import datetime, date

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Goal

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_goal(request):
    """Create a new goal for the authenticated user."""
    try:
        data = request.data
        title = data.get("title", "").strip()
        
        if not title:
            return Response(
                {"error": "Title is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Parse due_date if provided
        due_date = None
        if data.get("due_date"):
            due_date_str = data.get("due_date")
            if isinstance(due_date_str, str):
                try:
                    due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
                except ValueError:
                    return Response(
                        {"error": "Invalid date format. Use YYYY-MM-DD."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                due_date = due_date_str
        
        goal = Goal.objects.create(
            user=request.user,
            title=title,
            target_value=data.get("target_value", "").strip(),
            target_type=data.get("target_type", "").strip(),
            due_date=due_date,
            is_completed=data.get("is_completed", False),
        )
        
        return Response(
            {
                "message": "Goal created successfully.",
                "goal": {
                    "id": goal.id,
                    "title": goal.title,
                    "target_value": goal.target_value,
                    "target_type": goal.target_type,
                    "due_date": goal.due_date.isoformat() if goal.due_date and isinstance(goal.due_date, date) else (str(goal.due_date) if goal.due_date else None),
                    "is_completed": goal.is_completed,
                    "created_at": goal.created_at.isoformat(),
                },
            },
            status=status.HTTP_201_CREATED,
        )
    
    except Exception as exc:
        logger.exception("Create goal failed: %s", exc)
        return Response(
            {"error": "Unexpected error during goal creation."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_goal(request, goal_id):
    """Update an existing goal. Only the owner can update their goal."""
    try:
        try:
            goal = Goal.objects.get(id=goal_id, user=request.user)
        except Goal.DoesNotExist:
            return Response(
                {"error": "Goal not found or you don't have permission to update it."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        data = request.data
        
        if "title" in data:
            title = data.get("title", "").strip()
            if not title:
                return Response(
                    {"error": "Title cannot be empty."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            goal.title = title
        
        if "target_value" in data:
            goal.target_value = data.get("target_value", "").strip()
        
        if "target_type" in data:
            goal.target_type = data.get("target_type", "").strip()
        
        if "due_date" in data:
            due_date_value = data.get("due_date")
            if due_date_value:
                if isinstance(due_date_value, str):
                    try:
                        goal.due_date = datetime.strptime(due_date_value, "%Y-%m-%d").date()
                    except ValueError:
                        return Response(
                            {"error": "Invalid date format. Use YYYY-MM-DD."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                else:
                    goal.due_date = due_date_value
            else:
                goal.due_date = None
        
        if "is_completed" in data:
            goal.is_completed = data.get("is_completed", False)
        
        goal.save()
        
        return Response(
            {
                "message": "Goal updated successfully.",
                "goal": {
                    "id": goal.id,
                    "title": goal.title,
                    "target_value": goal.target_value,
                    "target_type": goal.target_type,
                    "due_date": goal.due_date.isoformat() if goal.due_date and isinstance(goal.due_date, date) else (str(goal.due_date) if goal.due_date else None),
                    "is_completed": goal.is_completed,
                    "created_at": goal.created_at.isoformat(),
                },
            },
            status=status.HTTP_200_OK,
        )
    
    except Exception as exc:
        logger.exception("Update goal failed: %s", exc)
        return Response(
            {"error": "Unexpected error during goal update."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

