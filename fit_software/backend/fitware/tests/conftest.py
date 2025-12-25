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

@pytest.fixture
def auth_client(api_client, user_payload, signup_url):
    """
    Signup yapar, access token alır ve Authorization header set edilmiş APIClient döndürür.
    """
    resp = api_client.post(signup_url, user_payload, format="json")
    assert resp.status_code == 201, resp.data
    access = resp.data["tokens"]["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    return api_client


@pytest.fixture
def second_user_payload():
    return {
        "first_name": "Second",
        "last_name": "User",
        "email": "seconduser@example.com",
        "password": "StrongPass123!",
        "repeat_password": "StrongPass123!",
    }


@pytest.fixture
def second_auth_client(api_client, second_user_payload, signup_url):
    resp = api_client.post(signup_url, second_user_payload, format="json")
    assert resp.status_code == 201, resp.data
    access = resp.data["tokens"]["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    return api_client