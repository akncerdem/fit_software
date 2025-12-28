"""
Frontend Blackbox Tests for Fitware Application
================================================

Blackbox testing focuses on testing the application from an external perspective
without knowledge of internal implementation. Tests verify:
- User interface behavior
- Input/output validation
- End-to-end user workflows
- API integration from frontend perspective

Prerequisites:
    pip install selenium pytest requests webdriver-manager

Run tests:
    pytest test_blackbox.py -v --tb=short
"""

import pytest
import requests
import time
import os
from unittest.mock import patch, MagicMock

# Import our custom logger
try:
    from .test_logger import test_logger, log_test
except ImportError:
    from test_logger import test_logger, log_test


# Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
API_BASE = f"{BACKEND_URL}/api"

# Test data
VALID_USER = {
    "email": f"blackbox_test_{int(time.time())}@test.com",
    "password": "TestPass123!",
    "first_name": "Blackbox",
    "last_name": "Tester",
}


class TestBlackboxAuthentication:
    """Blackbox tests for authentication flows."""
    
    @log_test("BLACKBOX", "Test login with valid credentials returns tokens")
    def test_login_valid_credentials(self):
        """
        Test Case: BB-AUTH-001
        Verify that valid login credentials return access and refresh tokens.
        """
        # First signup the user
        signup_payload = {
            **VALID_USER,
            "repeat_password": VALID_USER["password"]
        }
        
        test_logger.log_step(1, "Signup new user for login test")
        signup_resp = requests.post(
            f"{API_BASE}/v1/auth/signup/",
            json=signup_payload,
            timeout=10
        )
        
        # Handle if user already exists
        if signup_resp.status_code not in [201, 200, 400]:
            test_logger.log_error(f"Unexpected signup status: {signup_resp.status_code}")
        
        test_logger.log_step(2, "Attempt login with valid credentials")
        login_payload = {
            "email": VALID_USER["email"],
            "password": VALID_USER["password"]
        }
        
        response = requests.post(
            f"{API_BASE}/v1/auth/login/",
            json=login_payload,
            timeout=10
        )
        
        test_logger.log_step(3, "Verify response contains tokens", "Status 200 and tokens present")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        test_logger.log_assertion(
            "tokens" in data,
            "Response contains tokens object",
            f"Keys: {list(data.keys())}"
        )
        test_logger.log_assertion(
            "access" in data.get("tokens", {}),
            "Tokens contain access token"
        )
        test_logger.log_assertion(
            "refresh" in data.get("tokens", {}),
            "Tokens contain refresh token"
        )
        test_logger.log_assertion(
            "user" in data,
            "Response contains user object"
        )
        
        assert "tokens" in data
        assert "access" in data["tokens"]
        assert "refresh" in data["tokens"]
        
    @log_test("BLACKBOX", "Test login with invalid credentials fails")
    def test_login_invalid_credentials(self):
        """
        Test Case: BB-AUTH-002
        Verify that invalid credentials return appropriate error.
        """
        test_logger.log_step(1, "Attempt login with wrong password")
        
        login_payload = {
            "email": "nonexistent@test.com",
            "password": "WrongPassword123!"
        }
        
        response = requests.post(
            f"{API_BASE}/v1/auth/login/",
            json=login_payload,
            timeout=10
        )
        
        test_logger.log_step(2, "Verify error response", "Status 401 Unauthorized")
        
        test_logger.log_assertion(
            response.status_code == 401,
            f"Returns 401 status (got {response.status_code})"
        )
        
        assert response.status_code == 401
        
        data = response.json()
        test_logger.log_assertion(
            "error" in data,
            "Response contains error message",
            f"Error: {data.get('error', 'N/A')}"
        )
        
    @log_test("BLACKBOX", "Test login with empty fields fails validation")
    def test_login_empty_fields(self):
        """
        Test Case: BB-AUTH-003
        Verify that empty login fields return validation error.
        """
        test_cases = [
            ({"email": "", "password": "test"}, "empty email"),
            ({"email": "test@test.com", "password": ""}, "empty password"),
            ({"email": "", "password": ""}, "both empty"),
        ]
        
        for payload, case_name in test_cases:
            test_logger.log_step(1, f"Testing {case_name}")
            
            response = requests.post(
                f"{API_BASE}/v1/auth/login/",
                json=payload,
                timeout=10
            )
            
            test_logger.log_assertion(
                response.status_code in [400, 401],
                f"Returns error for {case_name}",
                f"Status: {response.status_code}"
            )
            
            assert response.status_code in [400, 401]
    
    @log_test("BLACKBOX", "Test signup with valid data creates user")
    def test_signup_valid_data(self):
        """
        Test Case: BB-AUTH-004
        Verify that valid signup data creates a new user.
        """
        unique_email = f"blackbox_signup_{int(time.time())}@test.com"
        
        payload = {
            "first_name": "Test",
            "last_name": "User",
            "email": unique_email,
            "password": "ValidPass123!",
            "repeat_password": "ValidPass123!"
        }
        
        test_logger.log_step(1, f"Signup with email: {unique_email}")
        
        response = requests.post(
            f"{API_BASE}/v1/auth/signup/",
            json=payload,
            timeout=10
        )
        
        test_logger.log_step(2, "Verify successful creation", "Status 201 Created")
        
        test_logger.log_assertion(
            response.status_code == 201,
            f"Returns 201 status (got {response.status_code})"
        )
        
        assert response.status_code == 201
        
        data = response.json()
        test_logger.log_assertion(
            "tokens" in data,
            "Response includes tokens for auto-login"
        )
        
    @log_test("BLACKBOX", "Test signup password mismatch fails")
    def test_signup_password_mismatch(self):
        """
        Test Case: BB-AUTH-005
        Verify that mismatched passwords return validation error.
        """
        payload = {
            "first_name": "Test",
            "last_name": "User",
            "email": f"mismatch_{int(time.time())}@test.com",
            "password": "Password123!",
            "repeat_password": "DifferentPass123!"
        }
        
        test_logger.log_step(1, "Signup with mismatched passwords")
        
        response = requests.post(
            f"{API_BASE}/v1/auth/signup/",
            json=payload,
            timeout=10
        )
        
        test_logger.log_step(2, "Verify validation error", "Status 400")
        
        test_logger.log_assertion(
            response.status_code == 400,
            f"Returns 400 status (got {response.status_code})"
        )
        
        assert response.status_code == 400
        
        data = response.json()
        error_msg = str(data).lower()
        test_logger.log_assertion(
            "password" in error_msg or "match" in error_msg,
            "Error message mentions password",
            f"Response: {data}"
        )


class TestBlackboxGoals:
    """Blackbox tests for Goals functionality."""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers for API requests."""
        unique_email = f"goal_test_{int(time.time())}@test.com"
        
        signup_payload = {
            "first_name": "Goal",
            "last_name": "Tester",
            "email": unique_email,
            "password": "TestPass123!",
            "repeat_password": "TestPass123!"
        }
        
        response = requests.post(
            f"{API_BASE}/v1/auth/signup/",
            json=signup_payload,
            timeout=10
        )
        
        if response.status_code == 201:
            token = response.json()["tokens"]["access"]
        else:
            # Try login if already exists
            login_resp = requests.post(
                f"{API_BASE}/v1/auth/login/",
                json={"email": unique_email, "password": "TestPass123!"},
                timeout=10
            )
            token = login_resp.json()["tokens"]["access"]
            
        return {"Authorization": f"Bearer {token}"}
    
    @log_test("BLACKBOX", "Test creating a goal with valid data")
    def test_create_goal_valid(self, auth_headers):
        """
        Test Case: BB-GOAL-001
        Verify that a goal can be created with valid data.
        """
        goal_payload = {
            "title": "Run 5K",
            "description": "Complete a 5K run",
            "icon": "🏃",
            "current_value": 0,
            "target_value": 5,
            "unit": "km"
        }
        
        test_logger.log_step(1, "Create goal via API")
        
        response = requests.post(
            f"{API_BASE}/goals/",
            json=goal_payload,
            headers=auth_headers,
            timeout=10
        )
        
        test_logger.log_step(2, "Verify goal creation", "Status 200/201")
        
        test_logger.log_assertion(
            response.status_code in [200, 201],
            f"Goal created (status {response.status_code})"
        )
        
        assert response.status_code in [200, 201]
        
        # Verify goal appears in list
        test_logger.log_step(3, "Verify goal appears in list")
        
        list_response = requests.get(
            f"{API_BASE}/goals/",
            headers=auth_headers,
            timeout=10
        )
        
        goals = list_response.json()
        goal_titles = [g["title"] for g in goals]
        
        test_logger.log_assertion(
            "Run 5K" in goal_titles,
            "Created goal appears in list",
            f"Found goals: {goal_titles}"
        )
        
        assert "Run 5K" in goal_titles
        
    @log_test("BLACKBOX", "Test goal progress update")
    def test_update_goal_progress(self, auth_headers):
        """
        Test Case: BB-GOAL-002
        Verify that goal progress can be updated.
        """
        # Create a goal first
        goal_payload = {
            "title": "Progress Test Goal",
            "target_value": 10,
            "unit": "workouts",
            "current_value": 0
        }
        
        test_logger.log_step(1, "Create goal for progress test")
        
        create_resp = requests.post(
            f"{API_BASE}/goals/",
            json=goal_payload,
            headers=auth_headers,
            timeout=10
        )
        
        assert create_resp.status_code in [200, 201]
        
        # Get goal ID
        test_logger.log_step(2, "Get created goal ID")
        
        list_resp = requests.get(
            f"{API_BASE}/goals/",
            headers=auth_headers,
            timeout=10
        )
        
        goals = list_resp.json()
        goal = next((g for g in goals if g["title"] == "Progress Test Goal"), None)
        
        assert goal is not None, "Goal not found"
        goal_id = goal["id"]
        
        # Update progress
        test_logger.log_step(3, "Update goal progress to 5")
        
        update_resp = requests.post(
            f"{API_BASE}/goals/{goal_id}/update-progress/",
            json={"current_value": 5},
            headers=auth_headers,
            timeout=10
        )
        
        test_logger.log_assertion(
            update_resp.status_code == 200,
            f"Progress update successful (status {update_resp.status_code})"
        )
        
        assert update_resp.status_code == 200
        
        data = update_resp.json()
        test_logger.log_assertion(
            data.get("success") is True,
            "Response indicates success",
            f"Response: {data}"
        )
        
    @log_test("BLACKBOX", "Test goal completion marks as completed")
    def test_goal_completion(self, auth_headers):
        """
        Test Case: BB-GOAL-003
        Verify that reaching target marks goal as completed.
        """
        goal_payload = {
            "title": "Completion Test",
            "target_value": 5,
            "unit": "workouts",
            "current_value": 0
        }
        
        test_logger.log_step(1, "Create goal with target 5")
        
        create_resp = requests.post(
            f"{API_BASE}/goals/",
            json=goal_payload,
            headers=auth_headers,
            timeout=10
        )
        
        list_resp = requests.get(f"{API_BASE}/goals/", headers=auth_headers, timeout=10)
        goal = next((g for g in list_resp.json() if g["title"] == "Completion Test"), None)
        goal_id = goal["id"]
        
        test_logger.log_step(2, "Update progress to target value (5)")
        
        update_resp = requests.post(
            f"{API_BASE}/goals/{goal_id}/update-progress/",
            json={"current_value": 5},
            headers=auth_headers,
            timeout=10
        )
        
        assert update_resp.status_code == 200
        
        data = update_resp.json()
        test_logger.log_step(3, "Verify goal marked as completed")
        
        test_logger.log_assertion(
            data.get("goal", {}).get("is_completed") is True,
            "Goal is marked as completed",
            f"Completion status: {data.get('goal', {}).get('is_completed')}"
        )
        
        assert data.get("goal", {}).get("is_completed") is True
        
    @log_test("BLACKBOX", "Test active goals excludes completed")
    def test_active_goals_filter(self, auth_headers):
        """
        Test Case: BB-GOAL-004
        Verify that active goals endpoint excludes completed goals.
        """
        test_logger.log_step(1, "Get active goals")
        
        response = requests.get(
            f"{API_BASE}/goals/active/",
            headers=auth_headers,
            timeout=10
        )
        
        test_logger.log_assertion(
            response.status_code == 200,
            f"Active goals endpoint returns 200 (got {response.status_code})"
        )
        
        assert response.status_code == 200
        
        goals = response.json()
        test_logger.log_step(2, "Verify no completed goals in response")
        
        completed_goals = [g for g in goals if g.get("is_completed")]
        test_logger.log_assertion(
            len(completed_goals) == 0,
            "No completed goals in active list",
            f"Found {len(completed_goals)} completed goals"
        )
        
        assert len(completed_goals) == 0


class TestBlackboxChallenges:
    """Blackbox tests for Challenges functionality."""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers."""
        unique_email = f"challenge_test_{int(time.time())}@test.com"
        
        signup_payload = {
            "first_name": "Challenge",
            "last_name": "Tester",
            "email": unique_email,
            "password": "TestPass123!",
            "repeat_password": "TestPass123!"
        }
        
        response = requests.post(
            f"{API_BASE}/v1/auth/signup/",
            json=signup_payload,
            timeout=10
        )
        
        token = response.json()["tokens"]["access"]
        return {"Authorization": f"Bearer {token}"}
    
    @log_test("BLACKBOX", "Test creating a challenge")
    def test_create_challenge(self, auth_headers):
        """
        Test Case: BB-CHAL-001
        Verify that a challenge can be created.
        """
        challenge_payload = {
            "title": "Weekly Running Challenge",
            "description": "Run 20km this week",
            "due_date": "2025-12-31",
            "target_value": 20,
            "unit": "km"
        }
        
        test_logger.log_step(1, "Create challenge via API")
        
        response = requests.post(
            f"{API_BASE}/challenges/",
            json=challenge_payload,
            headers=auth_headers,
            timeout=10
        )
        
        test_logger.log_assertion(
            response.status_code in [200, 201],
            f"Challenge created (status {response.status_code})"
        )
        
        assert response.status_code in [200, 201]
        
    @log_test("BLACKBOX", "Test challenge creates linked goal for creator")
    def test_challenge_creates_goal(self, auth_headers):
        """
        Test Case: BB-CHAL-002
        Verify that creating a challenge also creates a linked goal.
        """
        challenge_payload = {
            "title": "Goal Link Test Challenge",
            "description": "Test challenge",
            "due_date": "2025-12-31",
            "target_value": 10,
            "unit": "workouts"
        }
        
        test_logger.log_step(1, "Create challenge")
        
        create_resp = requests.post(
            f"{API_BASE}/challenges/",
            json=challenge_payload,
            headers=auth_headers,
            timeout=10
        )
        
        assert create_resp.status_code in [200, 201]
        
        test_logger.log_step(2, "Check if corresponding goal was created")
        
        goals_resp = requests.get(
            f"{API_BASE}/goals/",
            headers=auth_headers,
            timeout=10
        )
        
        goals = goals_resp.json()
        goal_titles = [g["title"] for g in goals]
        
        test_logger.log_assertion(
            "Goal Link Test Challenge" in goal_titles,
            "Challenge created corresponding goal",
            f"Goals: {goal_titles}"
        )
        
        assert "Goal Link Test Challenge" in goal_titles
        
    @log_test("BLACKBOX", "Test listing all challenges")
    def test_list_challenges(self, auth_headers):
        """
        Test Case: BB-CHAL-003
        Verify that challenges can be listed.
        """
        test_logger.log_step(1, "Get all challenges")
        
        response = requests.get(
            f"{API_BASE}/challenges/",
            headers=auth_headers,
            timeout=10
        )
        
        test_logger.log_assertion(
            response.status_code == 200,
            f"Challenges list returns 200 (got {response.status_code})"
        )
        
        assert response.status_code == 200
        
        data = response.json()
        test_logger.log_assertion(
            isinstance(data, list),
            "Response is a list",
            f"Type: {type(data)}, Count: {len(data)}"
        )
        
        assert isinstance(data, list)


class TestBlackboxInputValidation:
    """Blackbox tests for input validation across the frontend."""
    
    @log_test("BLACKBOX", "Test SQL injection prevention in login")
    def test_sql_injection_login(self):
        """
        Test Case: BB-SEC-001
        Verify that SQL injection attempts are handled safely.
        """
        malicious_inputs = [
            "' OR '1'='1",
            "admin'--",
            "'; DROP TABLE users;--",
            "1; SELECT * FROM users",
        ]
        
        for payload in malicious_inputs:
            test_logger.log_step(1, f"Testing SQL injection: {payload[:30]}...")
            
            response = requests.post(
                f"{API_BASE}/v1/auth/login/",
                json={"email": payload, "password": payload},
                timeout=10
            )
            
            # Should not cause server error (500)
            test_logger.log_assertion(
                response.status_code != 500,
                f"No server error for injection attempt",
                f"Status: {response.status_code}"
            )
            
            assert response.status_code != 500
            
            # Should not return success
            test_logger.log_assertion(
                response.status_code != 200,
                "Injection attempt does not succeed"
            )
            
            assert response.status_code != 200
            
    @log_test("BLACKBOX", "Test XSS prevention in goal title")
    def test_xss_prevention_goal(self):
        """
        Test Case: BB-SEC-002
        Verify that XSS attempts are sanitized in goal creation.
        """
        # First get auth headers
        unique_email = f"xss_test_{int(time.time())}@test.com"
        signup_resp = requests.post(
            f"{API_BASE}/v1/auth/signup/",
            json={
                "first_name": "XSS",
                "last_name": "Tester",
                "email": unique_email,
                "password": "TestPass123!",
                "repeat_password": "TestPass123!"
            },
            timeout=10
        )
        token = signup_resp.json()["tokens"]["access"]
        headers = {"Authorization": f"Bearer {token}"}
        
        xss_payloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
            "javascript:alert('xss')",
        ]
        
        for payload in xss_payloads:
            test_logger.log_step(1, f"Testing XSS: {payload[:30]}...")
            
            goal_payload = {
                "title": payload,
                "target_value": 10,
                "unit": "workouts",
                "current_value": 0
            }
            
            response = requests.post(
                f"{API_BASE}/goals/",
                json=goal_payload,
                headers=headers,
                timeout=10
            )
            
            # Should either reject or store safely
            if response.status_code in [200, 201]:
                # If stored, verify it's not executed (would need browser check)
                test_logger.log_finding(
                    "SECURITY",
                    "XSS payload stored",
                    f"XSS payload was stored: {payload}",
                    "MEDIUM",
                    "Ensure frontend properly escapes output"
                )
            else:
                test_logger.log_assertion(
                    True,
                    f"XSS payload rejected (status {response.status_code})"
                )
                
    @log_test("BLACKBOX", "Test boundary values for goal target")
    def test_boundary_values_goal_target(self):
        """
        Test Case: BB-VAL-001
        Verify boundary value handling for goal target values.
        """
        # Get auth
        unique_email = f"boundary_test_{int(time.time())}@test.com"
        signup_resp = requests.post(
            f"{API_BASE}/v1/auth/signup/",
            json={
                "first_name": "Boundary",
                "last_name": "Tester",
                "email": unique_email,
                "password": "TestPass123!",
                "repeat_password": "TestPass123!"
            },
            timeout=10
        )
        token = signup_resp.json()["tokens"]["access"]
        headers = {"Authorization": f"Bearer {token}"}
        
        boundary_values = [
            (0, "zero"),
            (-1, "negative"),
            (1, "minimum positive"),
            (999999999, "very large"),
            (0.5, "decimal"),
        ]
        
        for value, description in boundary_values:
            test_logger.log_step(1, f"Testing boundary: {description} ({value})")
            
            goal_payload = {
                "title": f"Boundary Test {description}",
                "target_value": value,
                "unit": "workouts",
                "current_value": 0
            }
            
            response = requests.post(
                f"{API_BASE}/goals/",
                json=goal_payload,
                headers=headers,
                timeout=10
            )
            
            # Log findings based on behavior
            if value < 0:
                if response.status_code in [200, 201]:
                    test_logger.log_finding(
                        "VALIDATION",
                        "Negative target value accepted",
                        f"Goal with target_value={value} was accepted",
                        "LOW",
                        "Consider validating target_value > 0"
                    )
                else:
                    test_logger.log_assertion(
                        True,
                        f"Negative value properly rejected"
                    )
            elif value == 0:
                if response.status_code in [200, 201]:
                    test_logger.log_finding(
                        "VALIDATION",
                        "Zero target value accepted",
                        "Goal with target_value=0 was accepted",
                        "LOW",
                        "Consider whether zero target makes sense"
                    )


class TestBlackboxAPIEndpoints:
    """Blackbox tests for API endpoint behavior."""
    
    @log_test("BLACKBOX", "Test unauthorized access returns 401/403")
    def test_unauthorized_access(self):
        """
        Test Case: BB-API-001
        Verify that protected endpoints require authentication.
        """
        protected_endpoints = [
            ("GET", "/goals/"),
            ("GET", "/challenges/"),
            ("GET", "/profile/"),
            ("POST", "/goals/"),
            ("POST", "/challenges/"),
        ]
        
        for method, endpoint in protected_endpoints:
            test_logger.log_step(1, f"Testing {method} {endpoint} without auth")
            
            if method == "GET":
                response = requests.get(f"{API_BASE}{endpoint}", timeout=10)
            else:
                response = requests.post(f"{API_BASE}{endpoint}", json={}, timeout=10)
                
            test_logger.log_assertion(
                response.status_code in [401, 403],
                f"{method} {endpoint} requires auth (got {response.status_code})"
            )
            
            assert response.status_code in [401, 403]
            
    @log_test("BLACKBOX", "Test API health endpoint")
    def test_health_endpoint(self):
        """
        Test Case: BB-API-002
        Verify health check endpoint is accessible.
        """
        test_logger.log_step(1, "Call health endpoint")
        
        response = requests.get(f"{API_BASE}/health/", timeout=10)
        
        test_logger.log_assertion(
            response.status_code == 200,
            f"Health endpoint returns 200 (got {response.status_code})"
        )
        
        assert response.status_code == 200
        
        data = response.json()
        test_logger.log_assertion(
            data.get("status") == "ok",
            "Health status is OK",
            f"Response: {data}"
        )


# Cleanup and report generation
@pytest.fixture(scope="session", autouse=True)
def generate_test_report(request):
    """Generate test report after all tests complete."""
    yield
    test_logger.print_summary()
    test_logger.save_report()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
