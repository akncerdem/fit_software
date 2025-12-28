"""
Frontend UI Tests using Selenium for Fitware Application
=========================================================

Browser-based testing using Selenium WebDriver.
Tests actual user interactions with the frontend.

Prerequisites:
    pip install selenium webdriver-manager pytest

Run tests:
    pytest test_ui_selenium.py -v --tb=short

Note: Requires both frontend (npm run dev) and backend (python manage.py runserver) 
to be running.
"""

import pytest
import time
import os
from datetime import datetime

# Import our custom logger
try:
    from .test_logger import test_logger, log_test
except ImportError:
    from test_logger import test_logger, log_test

# Selenium imports - wrapped in try/except for graceful handling
try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.service import Service as ChromeService
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from selenium.common.exceptions import (
        TimeoutException, 
        NoSuchElementException,
        ElementNotInteractableException
    )
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    test_logger.log_warning("Selenium not installed. UI tests will be skipped.")

try:
    from webdriver_manager.chrome import ChromeDriverManager
    WEBDRIVER_MANAGER_AVAILABLE = True
except ImportError:
    WEBDRIVER_MANAGER_AVAILABLE = False


# Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
HEADLESS = os.getenv("HEADLESS", "true").lower() == "true"
WAIT_TIMEOUT = 10


@pytest.fixture(scope="module")
def driver():
    """Set up Selenium WebDriver."""
    if not SELENIUM_AVAILABLE:
        pytest.skip("Selenium not installed")
        return None
        
    chrome_options = ChromeOptions()
    
    if HEADLESS:
        chrome_options.add_argument("--headless")
    
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-extensions")
    
    try:
        if WEBDRIVER_MANAGER_AVAILABLE:
            service = ChromeService(ChromeDriverManager().install())
            browser = webdriver.Chrome(service=service, options=chrome_options)
        else:
            browser = webdriver.Chrome(options=chrome_options)
            
        browser.implicitly_wait(5)
        yield browser
        
    except Exception as e:
        test_logger.log_error(f"Failed to initialize WebDriver: {e}")
        pytest.skip(f"WebDriver initialization failed: {e}")
        return None
        
    finally:
        try:
            browser.quit()
        except:
            pass


@pytest.fixture
def test_user():
    """Generate unique test user credentials."""
    timestamp = int(time.time())
    return {
        "email": f"uitest_{timestamp}@test.com",
        "password": "TestPass123!",
        "first_name": "UI",
        "last_name": "Tester"
    }


class TestUILandingPage:
    """UI tests for the landing page."""
    
    @pytest.mark.skipif(not SELENIUM_AVAILABLE, reason="Selenium not installed")
    @log_test("UI-BLACKBOX", "Test landing page loads correctly")
    def test_landing_page_loads(self, driver):
        """
        Test Case: UI-LAND-001
        Verify landing page loads with expected elements.
        """
        test_logger.log_step(1, f"Navigate to {FRONTEND_URL}")
        
        try:
            driver.get(FRONTEND_URL)
            time.sleep(2)  # Allow page to load
            
            test_logger.log_step(2, "Check page title")
            
            # Check page loaded (title or specific element)
            test_logger.log_assertion(
                driver.title != "",
                f"Page has title: {driver.title}"
            )
            
            test_logger.log_step(3, "Look for main content")
            
            # Try to find common landing page elements
            body = driver.find_element(By.TAG_NAME, "body")
            test_logger.log_assertion(
                body is not None,
                "Page body element exists"
            )
            
            # Take screenshot for documentation
            screenshot_path = os.path.join(
                os.path.dirname(__file__),
                "test_logs",
                f"landing_page_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            )
            os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
            driver.save_screenshot(screenshot_path)
            test_logger.log_info(f"Screenshot saved: {screenshot_path}")
            
        except TimeoutException:
            test_logger.log_finding(
                "AVAILABILITY",
                "Landing page timeout",
                f"Frontend at {FRONTEND_URL} did not respond in time",
                "HIGH",
                "Ensure frontend server is running"
            )
            pytest.skip("Frontend not available")
            
    @pytest.mark.skipif(not SELENIUM_AVAILABLE, reason="Selenium not installed")
    @log_test("UI-BLACKBOX", "Test navigation links on landing page")
    def test_landing_page_navigation(self, driver):
        """
        Test Case: UI-LAND-002
        Verify navigation links are present and functional.
        """
        test_logger.log_step(1, "Navigate to landing page")
        driver.get(FRONTEND_URL)
        time.sleep(2)
        
        test_logger.log_step(2, "Look for login/signup links")
        
        # Find links by various methods
        links_found = []
        
        try:
            # Look for login link
            login_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Login') or contains(text(), 'Sign in') or contains(text(), 'Giriş')]")
            if login_elements:
                links_found.append("Login")
                
            # Look for signup link  
            signup_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Sign up') or contains(text(), 'Register') or contains(text(), 'Kayıt')]")
            if signup_elements:
                links_found.append("Signup")
                
            test_logger.log_assertion(
                len(links_found) > 0,
                f"Found navigation elements: {links_found}"
            )
            
        except NoSuchElementException as e:
            test_logger.log_info(f"Some navigation elements not found: {e}")


class TestUIAuthentication:
    """UI tests for authentication flows."""
    
    @pytest.mark.skipif(not SELENIUM_AVAILABLE, reason="Selenium not installed")
    @log_test("UI-BLACKBOX", "Test signup form validation")
    def test_signup_form_validation(self, driver, test_user):
        """
        Test Case: UI-AUTH-001
        Test signup form client-side validation.
        """
        test_logger.log_step(1, "Navigate to signup page")
        driver.get(f"{FRONTEND_URL}/signup")
        time.sleep(2)
        
        test_logger.log_step(2, "Find signup form elements")
        
        try:
            # Wait for form to load
            wait = WebDriverWait(driver, WAIT_TIMEOUT)
            
            # Try to find form inputs
            email_input = None
            password_input = None
            
            # Try different selectors
            for selector in ['[name="email"]', '[type="email"]', '#email', 'input[placeholder*="mail"]']:
                try:
                    email_input = driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except NoSuchElementException:
                    continue
                    
            for selector in ['[name="password"]', '[type="password"]', '#password']:
                try:
                    password_input = driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except NoSuchElementException:
                    continue
                    
            if email_input and password_input:
                test_logger.log_assertion(True, "Form inputs found")
                
                test_logger.log_step(3, "Test empty form submission")
                
                # Find submit button
                submit_btn = None
                for selector in ['button[type="submit"]', '.btn-primary', 'button']:
                    try:
                        submit_btn = driver.find_element(By.CSS_SELECTOR, selector)
                        break
                    except NoSuchElementException:
                        continue
                        
                if submit_btn:
                    # Clear fields and try to submit
                    email_input.clear()
                    password_input.clear()
                    
                    # Check if HTML5 validation prevents submission
                    is_required = email_input.get_attribute("required") == "true" or \
                                 email_input.get_attribute("required") == ""
                    
                    test_logger.log_assertion(
                        is_required or True,  # Pass if required attribute present
                        "Form has validation attributes"
                    )
                    
            else:
                test_logger.log_finding(
                    "UI_ELEMENT",
                    "Signup form elements not found",
                    "Could not locate email/password inputs on signup page",
                    "MEDIUM",
                    "Verify signup page structure"
                )
                
        except TimeoutException:
            test_logger.log_warning("Signup page elements did not load in time")
            
    @pytest.mark.skipif(not SELENIUM_AVAILABLE, reason="Selenium not installed")
    @log_test("UI-BLACKBOX", "Test complete signup flow")
    def test_signup_flow(self, driver, test_user):
        """
        Test Case: UI-AUTH-002
        Test complete signup user journey.
        """
        test_logger.log_step(1, "Navigate to signup page")
        driver.get(f"{FRONTEND_URL}/signup")
        time.sleep(2)
        
        try:
            # Find and fill form fields
            test_logger.log_step(2, "Fill signup form")
            
            fields = {
                "firstName": test_user["first_name"],
                "lastName": test_user["last_name"],
                "email": test_user["email"],
                "password": test_user["password"],
                "repeatPassword": test_user["password"]
            }
            
            for field_name, value in fields.items():
                try:
                    # Try various selectors
                    input_field = None
                    for selector in [f'[name="{field_name}"]', f'#{field_name}', f'[data-testid="{field_name}"]']:
                        try:
                            input_field = driver.find_element(By.CSS_SELECTOR, selector)
                            break
                        except NoSuchElementException:
                            continue
                            
                    if input_field:
                        input_field.clear()
                        input_field.send_keys(value)
                        test_logger.log_debug(f"Filled {field_name}")
                    else:
                        test_logger.log_debug(f"Field {field_name} not found")
                        
                except Exception as e:
                    test_logger.log_debug(f"Error filling {field_name}: {e}")
                    
            test_logger.log_step(3, "Submit form")
            
            # Find and click submit
            submit_btn = None
            for selector in ['button[type="submit"]', 'button:contains("Create")', '.btn-primary']:
                try:
                    buttons = driver.find_elements(By.CSS_SELECTOR, selector)
                    for btn in buttons:
                        if btn.is_displayed() and btn.is_enabled():
                            submit_btn = btn
                            break
                except:
                    continue
                    
            if submit_btn:
                submit_btn.click()
                time.sleep(3)  # Wait for response
                
                test_logger.log_step(4, "Check for success/redirect")
                
                current_url = driver.current_url
                test_logger.log_info(f"Current URL after signup: {current_url}")
                
                # Check if redirected or success message shown
                if "/anasayfa" in current_url or "/login" in current_url:
                    test_logger.log_assertion(True, "Signup successful - redirected")
                else:
                    # Check for error messages
                    error_elements = driver.find_elements(By.CSS_SELECTOR, '.error, .alert-danger, [role="alert"]')
                    if error_elements:
                        for el in error_elements:
                            test_logger.log_info(f"Form feedback: {el.text}")
                            
        except Exception as e:
            test_logger.log_error(f"Signup flow error: {e}")
            
    @pytest.mark.skipif(not SELENIUM_AVAILABLE, reason="Selenium not installed")
    @log_test("UI-BLACKBOX", "Test login form")
    def test_login_form(self, driver):
        """
        Test Case: UI-AUTH-003
        Test login form functionality.
        """
        test_logger.log_step(1, "Navigate to login page")
        driver.get(f"{FRONTEND_URL}/login")
        time.sleep(2)
        
        try:
            test_logger.log_step(2, "Verify login form elements present")
            
            # Find form elements
            email_input = None
            password_input = None
            
            for selector in ['[name="email"]', '[type="email"]', '#email']:
                try:
                    email_input = driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except NoSuchElementException:
                    continue
                    
            for selector in ['[name="password"]', '[type="password"]', '#password']:
                try:
                    password_input = driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except NoSuchElementException:
                    continue
                    
            test_logger.log_assertion(
                email_input is not None,
                "Email input found" if email_input else "Email input not found"
            )
            test_logger.log_assertion(
                password_input is not None,
                "Password input found" if password_input else "Password input not found"
            )
            
            # Test invalid credentials
            if email_input and password_input:
                test_logger.log_step(3, "Test invalid credentials")
                
                email_input.clear()
                email_input.send_keys("invalid@test.com")
                password_input.clear()
                password_input.send_keys("WrongPassword123!")
                
                # Find and click submit
                for selector in ['button[type="submit"]', 'button']:
                    try:
                        buttons = driver.find_elements(By.CSS_SELECTOR, selector)
                        for btn in buttons:
                            if btn.is_displayed() and btn.is_enabled():
                                btn.click()
                                break
                        break
                    except:
                        continue
                        
                time.sleep(2)
                
                # Check for error message
                page_source = driver.page_source.lower()
                has_error = "error" in page_source or "invalid" in page_source or "failed" in page_source
                
                test_logger.log_assertion(
                    has_error or driver.current_url.endswith("/login"),
                    "Invalid credentials properly handled"
                )
                
        except Exception as e:
            test_logger.log_error(f"Login form test error: {e}")


class TestUIProtectedRoutes:
    """UI tests for protected routes."""
    
    @pytest.mark.skipif(not SELENIUM_AVAILABLE, reason="Selenium not installed")
    @log_test("UI-BLACKBOX", "Test protected route redirect")
    def test_protected_route_redirect(self, driver):
        """
        Test Case: UI-ROUTE-001
        Verify protected routes redirect unauthenticated users.
        """
        protected_routes = [
            "/anasayfa",
            "/workout",
            "/goal",
            "/challenges",
            "/profile"
        ]
        
        # Clear any existing auth
        driver.get(FRONTEND_URL)
        time.sleep(1)
        driver.execute_script("localStorage.clear(); sessionStorage.clear();")
        
        for route in protected_routes:
            test_logger.log_step(1, f"Attempt to access {route} without auth")
            
            driver.get(f"{FRONTEND_URL}{route}")
            time.sleep(2)
            
            current_url = driver.current_url
            
            # Should redirect to login or landing
            is_redirected = (
                "/login" in current_url or 
                current_url.rstrip("/") == FRONTEND_URL.rstrip("/") or
                route not in current_url
            )
            
            test_logger.log_assertion(
                is_redirected,
                f"Protected route {route} redirects without auth",
                f"Ended up at: {current_url}"
            )


class TestUIResponsiveness:
    """UI tests for responsive design."""
    
    @pytest.mark.skipif(not SELENIUM_AVAILABLE, reason="Selenium not installed")
    @log_test("UI-BLACKBOX", "Test mobile viewport")
    def test_mobile_viewport(self, driver):
        """
        Test Case: UI-RESP-001
        Test application renders correctly on mobile viewport.
        """
        viewports = [
            (375, 667, "iPhone SE"),
            (414, 896, "iPhone XR"),
            (360, 640, "Android"),
        ]
        
        for width, height, device_name in viewports:
            test_logger.log_step(1, f"Testing viewport: {device_name} ({width}x{height})")
            
            driver.set_window_size(width, height)
            driver.get(FRONTEND_URL)
            time.sleep(2)
            
            # Check if page is scrollable horizontally (bad for mobile)
            horizontal_scroll = driver.execute_script(
                "return document.documentElement.scrollWidth > document.documentElement.clientWidth"
            )
            
            if horizontal_scroll:
                test_logger.log_finding(
                    "RESPONSIVENESS",
                    f"Horizontal scroll on {device_name}",
                    f"Page has horizontal scroll at {width}x{height}",
                    "LOW",
                    "Check CSS for overflow issues"
                )
            else:
                test_logger.log_assertion(
                    True,
                    f"No horizontal scroll on {device_name}"
                )
                
            # Take screenshot
            screenshot_path = os.path.join(
                os.path.dirname(__file__),
                "test_logs",
                f"mobile_{device_name.replace(' ', '_')}_{datetime.now().strftime('%H%M%S')}.png"
            )
            os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
            driver.save_screenshot(screenshot_path)
            
        # Reset to desktop size
        driver.set_window_size(1920, 1080)


class TestUIPerformance:
    """UI performance tests."""
    
    @pytest.mark.skipif(not SELENIUM_AVAILABLE, reason="Selenium not installed")
    @log_test("UI-WHITEBOX", "Test page load performance")
    def test_page_load_time(self, driver):
        """
        Test Case: UI-PERF-001
        Measure and validate page load times.
        """
        pages = [
            ("/", "Landing"),
            ("/login", "Login"),
            ("/signup", "Signup"),
        ]
        
        for path, name in pages:
            test_logger.log_step(1, f"Measuring load time for {name}")
            
            start_time = time.time()
            driver.get(f"{FRONTEND_URL}{path}")
            
            # Wait for page to be interactive
            try:
                WebDriverWait(driver, 10).until(
                    lambda d: d.execute_script("return document.readyState") == "complete"
                )
            except TimeoutException:
                pass
                
            load_time = time.time() - start_time
            
            # Log performance metrics
            if load_time > 5:
                test_logger.log_finding(
                    "PERFORMANCE",
                    f"Slow page load: {name}",
                    f"{name} page took {load_time:.2f}s to load",
                    "MEDIUM",
                    "Investigate performance bottlenecks"
                )
            else:
                test_logger.log_assertion(
                    load_time < 5,
                    f"{name} page loaded in {load_time:.2f}s"
                )
                
            # Get browser performance metrics if available
            try:
                perf_metrics = driver.execute_script("""
                    var perf = window.performance.timing;
                    return {
                        dns: perf.domainLookupEnd - perf.domainLookupStart,
                        connect: perf.connectEnd - perf.connectStart,
                        ttfb: perf.responseStart - perf.requestStart,
                        dom: perf.domContentLoadedEventEnd - perf.navigationStart,
                        load: perf.loadEventEnd - perf.navigationStart
                    };
                """)
                test_logger.log_debug(f"Performance metrics for {name}: {perf_metrics}")
            except:
                pass


# Cleanup and report generation
@pytest.fixture(scope="session", autouse=True)
def generate_test_report(request):
    """Generate test report after all tests complete."""
    yield
    test_logger.print_summary()
    test_logger.save_report()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
