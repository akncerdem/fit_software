"""
Frontend Test Runner
====================

Runs all frontend blackbox and whitebox tests and generates comprehensive reports.

Usage:
    python run_frontend_tests.py                 # Run all tests
    python run_frontend_tests.py --blackbox     # Run only blackbox tests
    python run_frontend_tests.py --whitebox     # Run only whitebox tests
    python run_frontend_tests.py --ui           # Run only UI/Selenium tests
    python run_frontend_tests.py --no-ui        # Skip UI tests (no browser needed)
"""

import subprocess
import sys
import os
import argparse
from datetime import datetime

# Get the directory of this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(SCRIPT_DIR, "test_logs")

# Ensure log directory exists
os.makedirs(LOG_DIR, exist_ok=True)


def print_header():
    """Print test run header."""
    print("\n" + "=" * 70)
    print("           FITWARE FRONTEND TESTING SUITE")
    print("=" * 70)
    print(f"  Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Log Directory: {LOG_DIR}")
    print("=" * 70 + "\n")


def print_section(title):
    """Print section header."""
    print("\n" + "-" * 70)
    print(f"  {title}")
    print("-" * 70 + "\n")


def run_tests(test_file, description):
    """Run a specific test file and return the result."""
    print_section(f"Running: {description}")
    
    test_path = os.path.join(SCRIPT_DIR, test_file)
    
    if not os.path.exists(test_path):
        print(f"  WARNING: Test file not found: {test_path}")
        return False
        
    cmd = [
        sys.executable, "-m", "pytest",
        test_path,
        "-v",
        "--tb=short",
        "-x",  # Stop on first failure
        f"--junitxml={LOG_DIR}/junit_{test_file.replace('.py', '')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xml"
    ]
    
    try:
        result = subprocess.run(cmd, cwd=SCRIPT_DIR)
        return result.returncode == 0
    except Exception as e:
        print(f"  ERROR: Failed to run tests: {e}")
        return False


def check_dependencies():
    """Check if required dependencies are installed."""
    print_section("Checking Dependencies")
    
    dependencies = [
        ("pytest", "pytest"),
        ("requests", "requests"),
        ("selenium", "selenium (optional for UI tests)"),
    ]
    
    missing = []
    
    for module, name in dependencies:
        try:
            __import__(module)
            print(f"  ✓ {name}")
        except ImportError:
            if module == "selenium":
                print(f"  ⚠ {name} - Not installed (UI tests will be skipped)")
            else:
                print(f"  ✗ {name} - MISSING")
                missing.append(module)
                
    if missing:
        print(f"\n  Install missing dependencies: pip install {' '.join(missing)}")
        return False
        
    return True


def check_servers():
    """Check if frontend and backend servers are running."""
    print_section("Checking Servers")
    
    import requests
    
    servers = [
        ("http://localhost:8000/api/health/", "Backend"),
        ("http://localhost:5173", "Frontend"),
    ]
    
    all_running = True
    
    for url, name in servers:
        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code in [200, 304]:
                print(f"  ✓ {name} is running at {url}")
            else:
                print(f"  ⚠ {name} returned status {resp.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"  ✗ {name} is NOT running at {url}")
            all_running = False
        except Exception as e:
            print(f"  ⚠ {name} check failed: {e}")
            
    if not all_running:
        print("\n  WARNING: Some servers are not running.")
        print("  Start backend:  cd backend && python manage.py runserver")
        print("  Start frontend: cd frontend && npm run dev")
        
    return all_running


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Run Fitware frontend tests")
    parser.add_argument("--blackbox", action="store_true", help="Run only blackbox tests")
    parser.add_argument("--whitebox", action="store_true", help="Run only whitebox tests")
    parser.add_argument("--ui", action="store_true", help="Run only UI/Selenium tests")
    parser.add_argument("--no-ui", action="store_true", help="Skip UI tests")
    parser.add_argument("--skip-checks", action="store_true", help="Skip dependency and server checks")
    
    args = parser.parse_args()
    
    print_header()
    
    # Check dependencies and servers
    if not args.skip_checks:
        if not check_dependencies():
            print("\n  Aborting: Missing dependencies")
            sys.exit(1)
            
        check_servers()  # Warning only, don't abort
        
    # Determine which tests to run
    run_all = not (args.blackbox or args.whitebox or args.ui)
    
    results = []
    
    # Run blackbox tests
    if run_all or args.blackbox:
        success = run_tests("test_blackbox.py", "Blackbox Tests")
        results.append(("Blackbox Tests", success))
        
    # Run whitebox tests
    if run_all or args.whitebox:
        success = run_tests("test_whitebox.py", "Whitebox Tests")
        results.append(("Whitebox Tests", success))
        
    # Run UI tests (unless --no-ui)
    if (run_all or args.ui) and not args.no_ui:
        try:
            import selenium
            success = run_tests("test_ui_selenium.py", "UI/Selenium Tests")
            results.append(("UI Tests", success))
        except ImportError:
            print_section("UI Tests")
            print("  SKIPPED: Selenium not installed")
            print("  Install: pip install selenium webdriver-manager")
            results.append(("UI Tests", None))
            
    # Print final summary
    print("\n" + "=" * 70)
    print("                    FINAL SUMMARY")
    print("=" * 70)
    
    for name, success in results:
        if success is True:
            print(f"  ✓ {name}: PASSED")
        elif success is False:
            print(f"  ✗ {name}: FAILED")
        else:
            print(f"  ⚠ {name}: SKIPPED")
            
    print("=" * 70)
    print(f"  Log files saved to: {LOG_DIR}")
    print("=" * 70 + "\n")
    
    # Exit with appropriate code
    if any(s is False for _, s in results):
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
