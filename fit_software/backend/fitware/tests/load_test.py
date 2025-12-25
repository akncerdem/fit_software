"""
Load Testing Script for Fitware API
====================================
This script performs load testing on the Fitware backend API endpoints.

Usage:
    1. Using Locust (recommended for web UI):
       pip install locust
       locust -f load_test.py --host=http://localhost:8000
       
    2. Using standalone mode:
       python load_test.py

    3. Using concurrent futures (simpler):
       python load_test.py --mode=concurrent
"""

import argparse
import concurrent.futures
import json
import random
import string
import time
from dataclasses import dataclass
from typing import Optional
import statistics

try:
    import requests
except ImportError:
    print("Please install requests: pip install requests")
    exit(1)

# Configuration
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api"

# Test user credentials (will be created during setup)
TEST_USERS = []


@dataclass
class LoadTestResult:
    """Stores results of a single request"""
    endpoint: str
    method: str
    status_code: int
    response_time: float  # in milliseconds
    success: bool
    error: Optional[str] = None


class FitwareLoadTester:
    """Load tester for Fitware API"""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.results: list[LoadTestResult] = []
        self.access_token: Optional[str] = None
        self.user_email: Optional[str] = None
        
    def _random_email(self) -> str:
        """Generate a random email for testing"""
        random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        return f"loadtest_{random_str}@test.com"
    
    def _random_password(self) -> str:
        """Generate a random password"""
        return ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> LoadTestResult:
        """Make a timed request and record the result"""
        url = f"{self.base_url}{endpoint}"
        headers = kwargs.pop('headers', {})
        
        if self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        
        start_time = time.perf_counter()
        
        try:
            response = self.session.request(method, url, headers=headers, timeout=30, **kwargs)
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            
            result = LoadTestResult(
                endpoint=endpoint,
                method=method,
                status_code=response.status_code,
                response_time=elapsed_ms,
                success=200 <= response.status_code < 400
            )
            
        except requests.exceptions.RequestException as e:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            result = LoadTestResult(
                endpoint=endpoint,
                method=method,
                status_code=0,
                response_time=elapsed_ms,
                success=False,
                error=str(e)
            )
        
        self.results.append(result)
        return result
    
    # ==================== API Endpoint Tests ====================
    
    def test_health_check(self) -> LoadTestResult:
        """Test the health check endpoint"""
        return self._make_request("GET", f"{API_PREFIX}/health/")
    
    def test_signup(self, email: str = None, password: str = None) -> LoadTestResult:
        """Test user signup"""
        email = email or self._random_email()
        password = password or self._random_password()
        
        data = {
            "first_name": "Load",
            "last_name": "Tester",
            "email": email,
            "password": password,
            "repeat_password": password
        }
        
        result = self._make_request("POST", f"{API_PREFIX}/signup/", json=data)
        
        if result.success:
            self.user_email = email
            # Try to extract token from response
            try:
                response = self.session.post(
                    f"{self.base_url}{API_PREFIX}/signup/",
                    json=data,
                    timeout=30
                )
                if response.status_code == 201:
                    tokens = response.json().get('tokens', {})
                    self.access_token = tokens.get('access')
            except:
                pass
        
        return result
    
    def test_login(self, email: str = None, password: str = None) -> LoadTestResult:
        """Test user login"""
        data = {
            "email": email or self.user_email or "test@test.com",
            "password": password or "testpassword123"
        }
        
        result = self._make_request("POST", f"{API_PREFIX}/login/", json=data)
        return result
    
    def test_login_and_get_token(self, email: str, password: str) -> Optional[str]:
        """Login and return access token"""
        data = {"email": email, "password": password}
        
        try:
            response = self.session.post(
                f"{self.base_url}{API_PREFIX}/login/",
                json=data,
                timeout=30
            )
            if response.status_code == 200:
                tokens = response.json().get('tokens', {})
                self.access_token = tokens.get('access')
                return self.access_token
        except:
            pass
        return None
    
    def test_get_goals(self) -> LoadTestResult:
        """Test getting user goals"""
        return self._make_request("GET", f"{API_PREFIX}/goals/")
    
    def test_create_goal(self) -> LoadTestResult:
        """Test creating a goal"""
        data = {
            "name": f"Load Test Goal {random.randint(1, 1000)}",
            "goal_type": "steps",
            "target_value": random.randint(5000, 15000),
            "unit": "steps"
        }
        return self._make_request("POST", f"{API_PREFIX}/goals/", json=data)
    
    def test_get_profile(self) -> LoadTestResult:
        """Test getting user profile"""
        return self._make_request("GET", f"{API_PREFIX}/profile/me/")
    
    def test_get_challenges(self) -> LoadTestResult:
        """Test getting challenges"""
        return self._make_request("GET", f"{API_PREFIX}/challenges/")
    
    def test_get_badges(self) -> LoadTestResult:
        """Test getting badges"""
        return self._make_request("GET", f"{API_PREFIX}/badges/")
    
    def test_get_exercises(self) -> LoadTestResult:
        """Test getting exercises list"""
        return self._make_request("GET", f"{API_PREFIX}/exercises/")
    
    def test_get_workouts(self) -> LoadTestResult:
        """Test getting workouts"""
        return self._make_request("GET", f"{API_PREFIX}/workouts/")
    
    def test_token_refresh(self, refresh_token: str) -> LoadTestResult:
        """Test token refresh"""
        data = {"refresh": refresh_token}
        return self._make_request("POST", f"{API_PREFIX}/token/refresh/", json=data)


class LoadTestRunner:
    """Orchestrates load testing scenarios"""
    
    def __init__(self, base_url: str = BASE_URL, num_users: int = 10, iterations: int = 5):
        self.base_url = base_url
        self.num_users = num_users
        self.iterations = iterations
        self.all_results: list[LoadTestResult] = []
        self.test_credentials: list[tuple[str, str]] = []
    
    def setup_test_users(self):
        """Create test users for load testing"""
        print(f"\n📝 Creating {self.num_users} test users...")
        
        for i in range(self.num_users):
            tester = FitwareLoadTester(self.base_url)
            email = f"loadtest_user{i}_{int(time.time())}@test.com"
            password = f"TestPass{i}123!"
            
            data = {
                "first_name": "Load",
                "last_name": f"Tester{i}",
                "email": email,
                "password": password,
                "repeat_password": password
            }
            
            try:
                response = tester.session.post(
                    f"{self.base_url}{API_PREFIX}/signup/",
                    json=data,
                    timeout=30
                )
                if response.status_code == 201:
                    self.test_credentials.append((email, password))
                    print(f"  ✓ Created user {i + 1}/{self.num_users}")
                else:
                    print(f"  ✗ Failed to create user {i + 1}: {response.status_code}")
            except Exception as e:
                print(f"  ✗ Error creating user {i + 1}: {e}")
        
        print(f"✓ Created {len(self.test_credentials)} test users\n")
    
    def run_user_scenario(self, user_id: int, email: str, password: str) -> list[LoadTestResult]:
        """Run a complete user scenario"""
        tester = FitwareLoadTester(self.base_url)
        
        # Login first
        token = tester.test_login_and_get_token(email, password)
        
        if not token:
            print(f"  User {user_id}: Failed to authenticate")
            return tester.results
        
        # Run through various endpoints
        tester.test_health_check()
        tester.test_get_profile()
        tester.test_get_goals()
        tester.test_get_challenges()
        tester.test_get_badges()
        tester.test_get_exercises()
        tester.test_get_workouts()
        
        # Create a goal
        tester.test_create_goal()
        
        return tester.results
    
    def run_concurrent_test(self):
        """Run load test with concurrent users"""
        print(f"\n🚀 Starting load test with {self.num_users} concurrent users, {self.iterations} iterations each")
        print("=" * 60)
        
        # Setup test users first
        self.setup_test_users()
        
        if not self.test_credentials:
            print("❌ No test users created. Make sure the server is running.")
            return
        
        start_time = time.time()
        
        for iteration in range(self.iterations):
            print(f"\n📊 Iteration {iteration + 1}/{self.iterations}")
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.num_users) as executor:
                futures = []
                
                for i, (email, password) in enumerate(self.test_credentials):
                    future = executor.submit(self.run_user_scenario, i, email, password)
                    futures.append(future)
                
                for future in concurrent.futures.as_completed(futures):
                    try:
                        results = future.result()
                        self.all_results.extend(results)
                    except Exception as e:
                        print(f"  ⚠️ Error in user scenario: {e}")
        
        total_time = time.time() - start_time
        self.print_results(total_time)
    
    def run_sequential_test(self):
        """Run load test sequentially (for debugging)"""
        print(f"\n🚀 Starting sequential load test with {self.iterations} iterations")
        print("=" * 60)
        
        tester = FitwareLoadTester(self.base_url)
        start_time = time.time()
        
        for iteration in range(self.iterations):
            print(f"\n📊 Iteration {iteration + 1}/{self.iterations}")
            
            # Health check (no auth needed)
            result = tester.test_health_check()
            self._print_result(result)
            
            # Signup a new user
            result = tester.test_signup()
            self._print_result(result)
            
            # Login
            result = tester.test_login()
            self._print_result(result)
        
        total_time = time.time() - start_time
        self.all_results = tester.results
        self.print_results(total_time)
    
    def _print_result(self, result: LoadTestResult):
        """Print a single result"""
        status = "✓" if result.success else "✗"
        print(f"  {status} {result.method} {result.endpoint}: {result.status_code} ({result.response_time:.2f}ms)")
    
    def print_results(self, total_time: float):
        """Print summary statistics"""
        print("\n" + "=" * 60)
        print("📈 LOAD TEST RESULTS")
        print("=" * 60)
        
        if not self.all_results:
            print("No results to display.")
            return
        
        # Overall statistics
        total_requests = len(self.all_results)
        successful = sum(1 for r in self.all_results if r.success)
        failed = total_requests - successful
        success_rate = (successful / total_requests * 100) if total_requests > 0 else 0
        
        response_times = [r.response_time for r in self.all_results]
        avg_response = statistics.mean(response_times) if response_times else 0
        min_response = min(response_times) if response_times else 0
        max_response = max(response_times) if response_times else 0
        median_response = statistics.median(response_times) if response_times else 0
        
        # Calculate p95 and p99
        sorted_times = sorted(response_times)
        p95_idx = int(len(sorted_times) * 0.95)
        p99_idx = int(len(sorted_times) * 0.99)
        p95 = sorted_times[p95_idx] if sorted_times else 0
        p99 = sorted_times[p99_idx] if sorted_times else 0
        
        print(f"\n📊 Overall Statistics:")
        print(f"  Total Requests:    {total_requests}")
        print(f"  Successful:        {successful} ({success_rate:.1f}%)")
        print(f"  Failed:            {failed}")
        print(f"  Total Time:        {total_time:.2f}s")
        print(f"  Requests/Second:   {total_requests / total_time:.2f}")
        
        print(f"\n⏱️ Response Times (ms):")
        print(f"  Average:           {avg_response:.2f}")
        print(f"  Median:            {median_response:.2f}")
        print(f"  Min:               {min_response:.2f}")
        print(f"  Max:               {max_response:.2f}")
        print(f"  95th Percentile:   {p95:.2f}")
        print(f"  99th Percentile:   {p99:.2f}")
        
        # Per-endpoint statistics
        print(f"\n📍 Per-Endpoint Statistics:")
        endpoints = {}
        for r in self.all_results:
            key = f"{r.method} {r.endpoint}"
            if key not in endpoints:
                endpoints[key] = []
            endpoints[key].append(r)
        
        for endpoint, results in sorted(endpoints.items()):
            times = [r.response_time for r in results]
            success_count = sum(1 for r in results if r.success)
            avg = statistics.mean(times) if times else 0
            print(f"  {endpoint}")
            print(f"    Requests: {len(results)}, Success: {success_count}, Avg: {avg:.2f}ms")
        
        # Errors summary
        errors = [r for r in self.all_results if not r.success]
        if errors:
            print(f"\n❌ Errors Summary:")
            error_counts = {}
            for e in errors:
                key = f"{e.method} {e.endpoint}: {e.status_code}"
                error_counts[key] = error_counts.get(key, 0) + 1
            
            for error, count in error_counts.items():
                print(f"  {error}: {count} occurrences")


# ==================== Locust Load Test (Optional) ====================

try:
    from locust import HttpUser, task, between
    
    class FitwareUser(HttpUser):
        """Locust user class for web-based load testing"""
        wait_time = between(1, 3)
        
        def on_start(self):
            """Setup: Create user and login"""
            # Generate unique user
            random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
            self.email = f"locust_{random_str}@test.com"
            self.password = "LocustTest123!"
            
            # Sign up
            signup_data = {
                "first_name": "Locust",
                "last_name": "Tester",
                "email": self.email,
                "password": self.password,
                "repeat_password": self.password
            }
            
            response = self.client.post(f"{API_PREFIX}/signup/", json=signup_data)
            
            if response.status_code == 201:
                tokens = response.json().get('tokens', {})
                self.access_token = tokens.get('access')
                self.refresh_token = tokens.get('refresh')
            else:
                # Try login if signup fails (user might already exist)
                self._login()
        
        def _login(self):
            """Login and store tokens"""
            login_data = {
                "email": self.email,
                "password": self.password
            }
            response = self.client.post(f"{API_PREFIX}/login/", json=login_data)
            
            if response.status_code == 200:
                tokens = response.json().get('tokens', {})
                self.access_token = tokens.get('access')
                self.refresh_token = tokens.get('refresh')
        
        def _auth_headers(self):
            """Get authorization headers"""
            if hasattr(self, 'access_token') and self.access_token:
                return {"Authorization": f"Bearer {self.access_token}"}
            return {}
        
        @task(10)
        def health_check(self):
            """Check health endpoint"""
            self.client.get(f"{API_PREFIX}/health/")
        
        @task(5)
        def get_profile(self):
            """Get user profile"""
            self.client.get(f"{API_PREFIX}/profile/me/", headers=self._auth_headers())
        
        @task(5)
        def get_goals(self):
            """Get user goals"""
            self.client.get(f"{API_PREFIX}/goals/", headers=self._auth_headers())
        
        @task(2)
        def create_goal(self):
            """Create a new goal"""
            data = {
                "name": f"Locust Goal {random.randint(1, 1000)}",
                "goal_type": "steps",
                "target_value": random.randint(5000, 15000),
                "unit": "steps"
            }
            self.client.post(f"{API_PREFIX}/goals/", json=data, headers=self._auth_headers())
        
        @task(3)
        def get_challenges(self):
            """Get challenges"""
            self.client.get(f"{API_PREFIX}/challenges/", headers=self._auth_headers())
        
        @task(3)
        def get_badges(self):
            """Get badges"""
            self.client.get(f"{API_PREFIX}/badges/", headers=self._auth_headers())
        
        @task(4)
        def get_exercises(self):
            """Get exercises list"""
            self.client.get(f"{API_PREFIX}/exercises/")
        
        @task(4)
        def get_workouts(self):
            """Get workouts"""
            self.client.get(f"{API_PREFIX}/workouts/", headers=self._auth_headers())

except ImportError:
    # Locust not installed, skip this class
    pass


def main():
    """Main entry point for the load test"""
    parser = argparse.ArgumentParser(description="Fitware API Load Tester")
    parser.add_argument("--url", default=BASE_URL, help="Base URL of the API")
    parser.add_argument("--users", type=int, default=10, help="Number of concurrent users")
    parser.add_argument("--iterations", type=int, default=5, help="Number of iterations per user")
    parser.add_argument("--mode", choices=["concurrent", "sequential"], default="concurrent",
                        help="Test mode: concurrent or sequential")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🏋️ FITWARE API LOAD TESTER")
    print("=" * 60)
    print(f"Target URL: {args.url}")
    print(f"Users: {args.users}")
    print(f"Iterations: {args.iterations}")
    print(f"Mode: {args.mode}")
    
    runner = LoadTestRunner(
        base_url=args.url,
        num_users=args.users,
        iterations=args.iterations
    )
    
    if args.mode == "concurrent":
        runner.run_concurrent_test()
    else:
        runner.run_sequential_test()


if __name__ == "__main__":
    main()
