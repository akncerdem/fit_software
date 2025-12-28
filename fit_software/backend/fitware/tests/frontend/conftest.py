"""
Pytest Configuration and Shared Fixtures for Frontend Tests
============================================================
"""

import pytest
import os
import time
import requests

# Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
API_BASE = f"{BACKEND_URL}/api"


@pytest.fixture(scope="session")
def api_base():
    """Return API base URL."""
    return API_BASE


@pytest.fixture(scope="session")
def frontend_url():
    """Return frontend URL."""
    return FRONTEND_URL


@pytest.fixture(scope="session")
def backend_url():
    """Return backend URL."""
    return BACKEND_URL


@pytest.fixture
def unique_email():
    """Generate a unique email for testing."""
    return f"test_{int(time.time())}_{os.getpid()}@test.com"


@pytest.fixture
def test_credentials(unique_email):
    """Generate test user credentials."""
    return {
        "email": unique_email,
        "password": "TestPass123!",
        "first_name": "Test",
        "last_name": "User",
        "repeat_password": "TestPass123!"
    }


@pytest.fixture
def registered_user(api_base, test_credentials):
    """Create and return a registered user with tokens."""
    response = requests.post(
        f"{api_base}/v1/auth/signup/",
        json=test_credentials,
        timeout=10
    )
    
    if response.status_code == 201:
        data = response.json()
        return {
            "email": test_credentials["email"],
            "password": test_credentials["password"],
            "access_token": data["tokens"]["access"],
            "refresh_token": data["tokens"]["refresh"],
            "user": data["user"]
        }
    else:
        pytest.skip(f"Could not create test user: {response.status_code}")


@pytest.fixture
def auth_headers(registered_user):
    """Return authorization headers for API requests."""
    return {"Authorization": f"Bearer {registered_user['access_token']}"}


@pytest.fixture(scope="session")
def backend_available():
    """Check if backend is available."""
    try:
        response = requests.get(f"{API_BASE}/health/", timeout=5)
        return response.status_code == 200
    except:
        return False


@pytest.fixture(scope="session")
def frontend_available():
    """Check if frontend is available."""
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        return response.status_code in [200, 304]
    except:
        return False


def pytest_configure(config):
    """Configure custom markers."""
    config.addinivalue_line(
        "markers", "blackbox: marks tests as blackbox tests"
    )
    config.addinivalue_line(
        "markers", "whitebox: marks tests as whitebox tests"
    )
    config.addinivalue_line(
        "markers", "ui: marks tests as UI/Selenium tests"
    )
    config.addinivalue_line(
        "markers", "slow: marks tests as slow running"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection based on markers."""
    # Skip UI tests if selenium not available
    try:
        import selenium
    except ImportError:
        skip_selenium = pytest.mark.skip(reason="Selenium not installed")
        for item in items:
            if "ui" in item.keywords or "selenium" in item.name.lower():
                item.add_marker(skip_selenium)


@pytest.fixture(autouse=True)
def log_test_name(request):
    """Log test name at start and end."""
    test_name = request.node.name
    print(f"\n>>> Starting: {test_name}")
    yield
    print(f"<<< Finished: {test_name}")
