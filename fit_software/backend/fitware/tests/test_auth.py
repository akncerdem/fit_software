import pytest
from django.contrib.auth.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from unittest.mock import patch

pytestmark = pytest.mark.django_db

def test_health_ok(api_client):
    r = api_client.get("/api/health/")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"


def test_signup_success(api_client, signup_url, user_payload):
    r = api_client.post(signup_url, user_payload, format="json")
    assert r.status_code == 201
    assert "tokens" in r.data
    assert r.data["user"]["email"] == user_payload["email"]

def test_signup_password_mismatch(api_client, signup_url, user_payload):
    bad = dict(user_payload)
    bad["repeat_password"] = "Different123!"
    r = api_client.post(signup_url, bad, format="json")
    assert r.status_code == 400
    assert r.data["error"] == "Passwords do not match."

def test_login_wrong_password(api_client, signup_url, login_url, user_payload):
    r1 = api_client.post(signup_url, user_payload, format="json")
    assert r1.status_code == 201
    r2 = api_client.post(login_url, {"email": user_payload["email"], "password": "WRONGPASS"}, format="json")
    assert r2.status_code == 401
    assert "error" in r2.data

@patch("fitware.urls.send_mail")
def test_password_reset_request_existing_email_sends_mail(mock_send_mail, api_client, reset_request_url):
    User.objects.create_user(username="a@b.com", email="a@b.com", password="XyZ12345!!")
    r = api_client.post(reset_request_url, {"email": "a@b.com"}, format="json")
    assert r.status_code == 200
    mock_send_mail.assert_called_once()

def test_password_reset_confirm_success(api_client, reset_confirm_url, login_url):
    user = User.objects.create_user(username="reset@ex.com", email="reset@ex.com", password="OldPass123!")
    gen = PasswordResetTokenGenerator()
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = gen.make_token(user)

    r = api_client.post(
        reset_confirm_url,
        {"uid": uid, "token": token, "new_password": "NewPass123!", "repeat_password": "NewPass123!"},
        format="json",
    )
    assert r.status_code == 200

    r2 = api_client.post(login_url, {"email": "reset@ex.com", "password": "NewPass123!"}, format="json")
    assert r2.status_code == 200
