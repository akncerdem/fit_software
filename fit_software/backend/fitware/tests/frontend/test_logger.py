"""
Custom Test Logger for Frontend Tests
Logs test findings to both console and file with detailed formatting.
"""

import logging
import os
from datetime import datetime
from functools import wraps
import json

# Create logs directory
LOG_DIR = os.path.join(os.path.dirname(__file__), "test_logs")
os.makedirs(LOG_DIR, exist_ok=True)

# Generate timestamped log file
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
LOG_FILE = os.path.join(LOG_DIR, f"frontend_test_results_{timestamp}.log")
JSON_REPORT = os.path.join(LOG_DIR, f"frontend_test_report_{timestamp}.json")


class TestResultLogger:
    """Logger for tracking and reporting test results."""
    
    def __init__(self, name: str = "FrontendTests"):
        self.name = name
        self.results = []
        self.logger = self._setup_logger()
        
    def _setup_logger(self) -> logging.Logger:
        """Set up file and console logging."""
        logger = logging.getLogger(self.name)
        logger.setLevel(logging.DEBUG)
        logger.handlers.clear()
        
        # File handler - detailed logs
        file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        file_format = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_format)
        
        # Console handler - colored output
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_format = logging.Formatter(
            '%(levelname)-8s | %(message)s'
        )
        console_handler.setFormatter(console_format)
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        return logger
    
    def log_test_start(self, test_name: str, test_type: str, description: str = ""):
        """Log the start of a test case."""
        self.logger.info("=" * 70)
        self.logger.info(f"TEST START: {test_name}")
        self.logger.info(f"Type: {test_type}")
        if description:
            self.logger.info(f"Description: {description}")
        self.logger.info("-" * 70)
        
    def log_step(self, step_num: int, action: str, expected: str = ""):
        """Log a test step."""
        self.logger.debug(f"  Step {step_num}: {action}")
        if expected:
            self.logger.debug(f"    Expected: {expected}")
            
    def log_assertion(self, condition: bool, message: str, details: str = ""):
        """Log an assertion result."""
        if condition:
            self.logger.info(f"  ✓ PASS: {message}")
        else:
            self.logger.error(f"  ✗ FAIL: {message}")
        if details:
            self.logger.debug(f"    Details: {details}")
            
    def log_finding(self, finding_type: str, title: str, description: str, 
                    severity: str = "INFO", recommendation: str = ""):
        """Log a test finding (bug, issue, observation)."""
        finding = {
            "type": finding_type,
            "title": title,
            "description": description,
            "severity": severity,
            "recommendation": recommendation,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(finding)
        
        self.logger.warning(f"FINDING [{severity}]: {title}")
        self.logger.warning(f"  Type: {finding_type}")
        self.logger.warning(f"  Description: {description}")
        if recommendation:
            self.logger.warning(f"  Recommendation: {recommendation}")
            
    def log_test_result(self, test_name: str, passed: bool, duration: float = 0, 
                        error_message: str = ""):
        """Log the final result of a test."""
        result = {
            "test_name": test_name,
            "passed": passed,
            "duration": duration,
            "error_message": error_message,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "PASSED ✓" if passed else "FAILED ✗"
        self.logger.info("-" * 70)
        self.logger.info(f"TEST RESULT: {status}")
        self.logger.info(f"Test: {test_name}")
        self.logger.info(f"Duration: {duration:.2f}s")
        if error_message:
            self.logger.error(f"Error: {error_message}")
        self.logger.info("=" * 70)
        self.logger.info("")
        
    def log_error(self, message: str, exception: Exception = None):
        """Log an error during test execution."""
        self.logger.error(f"ERROR: {message}")
        if exception:
            self.logger.exception(f"Exception: {exception}")
            
    def log_warning(self, message: str):
        """Log a warning."""
        self.logger.warning(f"WARNING: {message}")
        
    def log_info(self, message: str):
        """Log general information."""
        self.logger.info(message)
        
    def log_debug(self, message: str):
        """Log debug information."""
        self.logger.debug(message)
        
    def generate_summary(self) -> dict:
        """Generate a summary of all test results."""
        test_results = [r for r in self.results if "passed" in r]
        findings = [r for r in self.results if "finding_type" in r or "type" in r and "passed" not in r]
        
        total = len(test_results)
        passed = sum(1 for r in test_results if r.get("passed", False))
        failed = total - passed
        
        summary = {
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "pass_rate": (passed / total * 100) if total > 0 else 0,
            "total_findings": len(findings),
            "findings_by_severity": {},
            "timestamp": datetime.now().isoformat()
        }
        
        for finding in findings:
            severity = finding.get("severity", "INFO")
            summary["findings_by_severity"][severity] = \
                summary["findings_by_severity"].get(severity, 0) + 1
                
        return summary
    
    def save_report(self):
        """Save the test report to JSON file."""
        report = {
            "summary": self.generate_summary(),
            "results": self.results,
            "log_file": LOG_FILE
        }
        
        with open(JSON_REPORT, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
            
        self.logger.info(f"Report saved to: {JSON_REPORT}")
        return JSON_REPORT
    
    def print_summary(self):
        """Print a summary to console."""
        summary = self.generate_summary()
        
        print("\n" + "=" * 70)
        print("                     FRONTEND TEST SUMMARY")
        print("=" * 70)
        print(f"  Total Tests: {summary['total_tests']}")
        print(f"  Passed:      {summary['passed']} ✓")
        print(f"  Failed:      {summary['failed']} ✗")
        print(f"  Pass Rate:   {summary['pass_rate']:.1f}%")
        print("-" * 70)
        print(f"  Total Findings: {summary['total_findings']}")
        for severity, count in summary['findings_by_severity'].items():
            print(f"    {severity}: {count}")
        print("=" * 70)
        print(f"  Log File:    {LOG_FILE}")
        print(f"  JSON Report: {JSON_REPORT}")
        print("=" * 70 + "\n")


# Global logger instance
test_logger = TestResultLogger("FrontendTests")


def log_test(test_type: str, description: str = ""):
    """Decorator to automatically log test execution."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            import time
            test_name = func.__name__
            test_logger.log_test_start(test_name, test_type, description)
            
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                test_logger.log_test_result(test_name, True, duration)
                return result
            except AssertionError as e:
                duration = time.time() - start_time
                test_logger.log_test_result(test_name, False, duration, str(e))
                raise
            except Exception as e:
                duration = time.time() - start_time
                test_logger.log_error(f"Unexpected error in {test_name}", e)
                test_logger.log_test_result(test_name, False, duration, str(e))
                raise
                
        return wrapper
    return decorator
