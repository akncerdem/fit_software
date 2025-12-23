import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user_payload():
    return {
        "first_name": "Test",
        "last_name": "User",
        "email": "testuser@example.com",
        "password": "StrongPass123!",
        "repeat_password": "StrongPass123!",
    }

@pytest.fixture
def signup_url():
    return "/api/v1/auth/signup/"

@pytest.fixture
def login_url():
    return "/api/v1/auth/login/"

@pytest.fixture
def reset_request_url():
    return "/api/v1/auth/password/reset/"

@pytest.fixture
def reset_confirm_url():
    return "/api/v1/auth/password/reset/confirm/"
