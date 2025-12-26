import pytest
from django.apps import apps
from unittest.mock import patch

pytestmark = pytest.mark.django_db


def _get_models():
    Goal = apps.get_model("fitware", "Goal")
    ActivityLog = apps.get_model("fitware", "ActivityLog")
    Challenge = apps.get_model("fitware", "Challenge")
    ChallengeJoined = apps.get_model("fitware", "ChallengeJoined")
    return Goal, ActivityLog, Challenge, ChallengeJoined


# -----------------------
# GOALS (API + logic)
# -----------------------

def test_create_goal_sets_start_value_to_current_if_missing(auth_client):
    payload = {
        "title": "Run 5K",
        "description": "Cardio goal",
        "icon": "🏃",
        "current_value": 2,
        "target_value": 5,
        "unit": "km",
    }
    r = auth_client.post("/api/goals/", payload, format="json")
    assert r.status_code in (200, 201), r.data

    # GET list → verify created
    r2 = auth_client.get("/api/goals/", format="json")
    assert r2.status_code == 200
    assert len(r2.data) >= 1

    created = r2.data[0]
    assert created["title"] == "Run 5K"
    # start_value was default 0 but model save() makes it current_value
    assert float(created["start_value"]) == float(created["current_value"])


def test_goal_progress_increase_case_model_property():
    Goal, _, _, _ = _get_models()
    # start=0 target=10 current=5 => 50%
    g = Goal(start_value=0, current_value=5, target_value=10, unit="workouts", title="T", user_id=1)
    assert g.progress == 50.0


def test_goal_progress_decrease_case_model_property():
    Goal, _, _, _ = _get_models()
    # start=80 target=70 current=75 => (80-75)/(80-70)=5/10=50%
    g = Goal(start_value=80, current_value=75, target_value=70, unit="kg", title="T", user_id=1)
    assert g.progress == 50.0


@patch("fitware.badges.BadgeService.check_milestone_badges")
def test_update_progress_marks_completed_and_logs_activity(mock_badge, auth_client):
    Goal, ActivityLog, _, _ = _get_models()

    # create goal via API
    payload = {"title": "Do 10 workouts", "target_value": 10, "unit": "workouts", "current_value": 0}
    r = auth_client.post("/api/goals/", payload, format="json")
    assert r.status_code in (200, 201), r.data

    # find goal id from list
    goals = auth_client.get("/api/goals/", format="json").data
    goal_id = goals[0]["id"]

    # update progress to reach target
    r2 = auth_client.post(f"/api/goals/{goal_id}/update-progress/", {"current_value": 10}, format="json")
    assert r2.status_code == 200, r2.data
    assert r2.data["success"] is True
    assert r2.data["goal"]["is_completed"] is True

    # badge check should be called once on completion
    assert mock_badge.call_count == 1

    # activity log should include goal_completed
    goal_obj = Goal.objects.get(id=goal_id)
    logs = ActivityLog.objects.filter(user=goal_obj.user, action_type="goal_completed")
    assert logs.count() == 1


def test_active_goals_excludes_completed(auth_client):
    # create a goal and complete it
    r = auth_client.post("/api/goals/", {"title": "Finish", "target_value": 1, "unit": "workouts", "current_value": 0}, format="json")
    assert r.status_code in (200, 201)

    goal_id = auth_client.get("/api/goals/", format="json").data[0]["id"]
    r2 = auth_client.post(f"/api/goals/{goal_id}/update-progress/", {"current_value": 1}, format="json")
    assert r2.status_code == 200

    active = auth_client.get("/api/goals/active/", format="json")
    assert active.status_code == 200
    # should not include completed goals
    for g in active.data:
        assert g["is_completed"] is False


def test_log_visit_idempotent_same_day(auth_client):
    r1 = auth_client.post("/api/goals/log_visit/", {}, format="json")
    assert r1.status_code == 200
    assert r1.data["success"] is True

    r2 = auth_client.post("/api/goals/log_visit/", {}, format="json")
    assert r2.status_code == 200
    assert r2.data["success"] is True
    assert r2.data["message"] in ("Already logged today", "Visit logged")


def test_suggest_unknown_goal_returns_recognized_false(auth_client, monkeypatch):
    # Ensure Groq isn't called
    monkeypatch.delenv("GROQ_API_KEY", raising=False)

    r = auth_client.post("/api/goals/suggest/", {"title": "asdf", "description": ""}, format="json")
    assert r.status_code == 200
    assert r.data["recognized"] is False
    assert r.data["alternative"] is None


def test_suggest_keyword_fallback_running(auth_client, monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)

    r = auth_client.post("/api/goals/suggest/", {"title": "run 5k", "description": ""}, format="json")
    assert r.status_code == 200
    assert r.data["recognized"] is True
    assert r.data["alternative"]["unit"] == "km"


# -----------------------
# CHALLENGES (API + integration with Goals)
# -----------------------

def test_create_challenge_auto_creates_goal_and_joins_creator(auth_client):
    payload = {
        "title": "Weekly Run",
        "description": "Run total distance this week",
        "due_date": "2025-12-31",
        "target_value": 10,
        "unit": "km",
        "badge": "Weekly Run Badge",
    }
    r = auth_client.post("/api/challenges/", payload, format="json")
    assert r.status_code in (200, 201), r.data

    # challenge list should show participants >= 1 (creator auto-joined)
    lst = auth_client.get("/api/challenges/", format="json")
    assert lst.status_code == 200
    assert len(lst.data) >= 1
    assert lst.data[0]["participants"] >= 1

    # creator should also have a goal created with same title
    goals = auth_client.get("/api/goals/", format="json").data
    assert any(g["title"] == "Weekly Run" for g in goals)


def test_join_challenge_creates_goal_for_joiner_if_missing(auth_client, second_auth_client):
    # creator creates a challenge
    payload = {"title": "10 Workouts", "description": "Complete workouts", "due_date": "2025-12-31", "target_value": 10, "unit": "workouts"}
    r = auth_client.post("/api/challenges/", payload, format="json")
    assert r.status_code in (200, 201), r.data

    challenge_id = auth_client.get("/api/challenges/", format="json").data[0]["id"]

    # second user joins
    r2 = second_auth_client.post(f"/api/challenges/{challenge_id}/join/", {}, format="json")
    assert r2.status_code == 200, r2.data
    assert r2.data["is_joined"] is True

    # second user's goals should include a goal with same title
    goals2 = second_auth_client.get("/api/goals/", format="json").data
    assert any(g["title"] == "10 Workouts" for g in goals2)


def test_join_challenge_twice_does_not_duplicate_goal(auth_client, second_auth_client):
    payload = {"title": "Bike 20km", "description": "", "due_date": "2025-12-31", "target_value": 20, "unit": "km"}
    auth_client.post("/api/challenges/", payload, format="json")
    challenge_id = auth_client.get("/api/challenges/", format="json").data[0]["id"]

    # first join
    second_auth_client.post(f"/api/challenges/{challenge_id}/join/", {}, format="json")
    goals_before = second_auth_client.get("/api/goals/", format="json").data
    count_before = sum(1 for g in goals_before if g["title"] == "Bike 20km")

    # second join
    second_auth_client.post(f"/api/challenges/{challenge_id}/join/", {}, format="json")
    goals_after = second_auth_client.get("/api/goals/", format="json").data
    count_after = sum(1 for g in goals_after if g["title"] == "Bike 20km")

    assert count_after == count_before


def test_update_challenge_progress_syncs_goal(auth_client, second_auth_client):
    # create challenge
    auth_client.post("/api/challenges/", {"title": "Swim", "description": "", "due_date": "2025-12-31", "target_value": 20, "unit": "laps"}, format="json")
    challenge_id = auth_client.get("/api/challenges/", format="json").data[0]["id"]

    # join second user
    second_auth_client.post(f"/api/challenges/{challenge_id}/join/", {}, format="json")

    # update progress from challenge side
    r = second_auth_client.post(f"/api/challenges/{challenge_id}/update-progress/", {"progress_value": 7}, format="json")
    assert r.status_code == 200
    assert float(r.data["progress_value"]) == 7

    # goal should be synced to 7
    goals2 = second_auth_client.get("/api/goals/", format="json").data
    swim_goals = [g for g in goals2 if g["title"] == "Swim"]
    assert len(swim_goals) >= 1
    assert float(swim_goals[0]["current_value"]) == 7


def test_leave_challenge_removes_participation(auth_client, second_auth_client):
    auth_client.post("/api/challenges/", {"title": "LeaveTest", "description": "", "due_date": "2025-12-31", "target_value": 5, "unit": "km"}, format="json")
    challenge_id = auth_client.get("/api/challenges/", format="json").data[0]["id"]

    second_auth_client.post(f"/api/challenges/{challenge_id}/join/", {}, format="json")
    r = second_auth_client.post(f"/api/challenges/{challenge_id}/leave/", {}, format="json")
    assert r.status_code == 200

    # should no longer appear in /my/
    my = second_auth_client.get("/api/challenges/my/", format="json")
    assert my.status_code == 200
    assert all(ch["id"] != challenge_id for ch in my.data)
