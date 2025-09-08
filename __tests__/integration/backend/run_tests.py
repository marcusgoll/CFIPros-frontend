#!/usr/bin/env python3
"""
Backend Integration Test Runner
Orchestrates backend API integration test execution with environment support
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path
from typing import List, Optional

class TestRunner:
    """Manages backend integration test execution"""
    
    def __init__(self):
        self.backend_tests_dir = Path(__file__).parent
        self.project_root = self.backend_tests_dir.parent.parent.parent
        self.default_env = "local"
        
        # Available test environments
        self.environments = {
            "local": {
                "backend_url": "http://localhost:8000",
                "description": "Local development backend"
            },
            "staging": {
                "backend_url": "https://cfipros-api-staging.up.railway.app/api/v1",
                "description": "Staging environment on Railway"
            },
            "production": {
                "backend_url": "https://api.cfipros.com/api/v1", 
                "description": "Production environment (read-only tests)"
            }
        }
    
    def setup_environment(self, env_name: str):
        """Setup environment variables for test execution"""
        os.environ["TEST_ENV"] = env_name
        
        env_config = self.environments.get(env_name, {})
        if "backend_url" in env_config:
            os.environ["INTEGRATION_BACKEND_BASE_URL"] = env_config["backend_url"]
        
        # Load environment-specific .env file
        env_file = self.project_root / f".env.integration.{env_name}"
        if env_file.exists():
            print(f"Loading environment file: {env_file}")
            os.environ["PYTEST_ENV_FILE"] = str(env_file)
    
    def install_dependencies(self, force: bool = False):
        """Install Python test dependencies"""
        requirements_file = self.backend_tests_dir / "requirements.txt"
        
        if not requirements_file.exists():
            print("Requirements file not found")
            return False
        
        print("Installing Python dependencies...")
        
        cmd = [sys.executable, "-m", "pip", "install", "-r", str(requirements_file)]
        if force:
            cmd.append("--force-reinstall")
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print("✅ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            print(f"Output: {e.stdout}")
            print(f"Error: {e.stderr}")
            return False
    
    def run_pytest(self, args: List[str]) -> int:
        """Run pytest with specified arguments"""
        
        # Build pytest command
        pytest_cmd = [sys.executable, "-m", "pytest"]
        pytest_cmd.extend(args)
        
        # Add backend tests directory if no specific path provided
        if not any(str(self.backend_tests_dir) in arg for arg in args):
            if not any(arg.startswith("test_") for arg in args):
                pytest_cmd.append(str(self.backend_tests_dir))
        
        print(f"🧪 Running: {' '.join(pytest_cmd)}")
        print(f"📁 Working directory: {os.getcwd()}")
        print(f"🌍 Test environment: {os.environ.get('TEST_ENV', 'default')}")
        
        # Run pytest
        try:
            return subprocess.run(pytest_cmd, cwd=self.project_root).returncode
        except KeyboardInterrupt:
            print("\n🚫 Test execution interrupted by user")
            return 130
        except Exception as e:
            print(f"❌ Test execution failed: {e}")
            return 1
    
    def check_backend_availability(self, env_name: str) -> bool:
        """Check if backend is available for testing"""
        env_config = self.environments.get(env_name, {})
        backend_url = env_config.get("backend_url")
        
        if not backend_url:
            print(f"⚠️  No backend URL configured for environment: {env_name}")
            return False
        
        print(f"🏥 Checking backend health: {backend_url}")
        
        try:
            import httpx
            with httpx.Client(timeout=10.0) as client:
                health_url = f"{backend_url}/health" if "/api/v1" in backend_url else f"{backend_url}/health"
                response = client.get(health_url)
                
                if response.status_code in [200, 204]:
                    print(f"✅ Backend is healthy ({response.status_code})")
                    return True
                else:
                    print(f"⚠️  Backend health check returned: {response.status_code}")
                    return env_name != "local"  # Allow non-local environments with warnings
                    
        except ImportError:
            print("⚠️  httpx not available, skipping health check")
            return True
        except Exception as e:
            print(f"❌ Backend health check failed: {e}")
            return env_name != "local"  # Allow non-local environments even if unreachable
    
    def list_available_tests(self):
        """List available test modules and markers"""
        print("Available Test Modules:")
        
        test_files = list(self.backend_tests_dir.glob("test_*.py"))
        for test_file in sorted(test_files):
            print(f"   - {test_file.name}")
        
        print("\nAvailable Test Markers:")
        markers = [
            "unit - Unit tests",
            "integration - Integration tests", 
            "contract - API contract tests",
            "auth - Authentication tests",
            "security - Security and malicious file tests",
            "rate_limit - Rate limiting tests",
            "slow - Slow running tests (> 5s)",
            "requires_backend - Tests that need backend server running",
            "requires_database - Tests that need database connection",
            "clerk_integration - Clerk authentication integration tests",
            "performance - Performance and load tests"
        ]
        
        for marker in markers:
            print(f"   - {marker}")
    
    def run_health_check(self, env_name: str) -> int:
        """Run backend health check tests only"""
        print(f"🏥 Running backend health check for {env_name} environment")
        
        if not self.check_backend_availability(env_name):
            if env_name == "local":
                print("❌ Local backend not available. Please start the backend server.")
                return 1
            else:
                print("⚠️  Backend may not be available, but continuing with tests...")
        
        return self.run_pytest([
            "test_backend_health.py::TestBackendAccessibility::test_backend_health_check",
            "-v", "--tb=short"
        ])
    
    def run_contract_tests(self, env_name: str) -> int:
        """Run API contract tests"""
        print(f"📋 Running API contract tests for {env_name} environment")
        
        return self.run_pytest([
            "-m", "contract",
            "-v", "--tb=short"
        ])
    
    def run_authentication_tests(self, env_name: str) -> int:
        """Run authentication tests"""
        print(f"🔐 Running authentication tests for {env_name} environment")
        
        return self.run_pytest([
            "-m", "auth or clerk_integration", 
            "-v", "--tb=short"
        ])
    
    def run_security_tests(self, env_name: str) -> int:
        """Run security tests"""
        print(f"🛡️  Running security tests for {env_name} environment")
        
        # Skip security tests in production
        if env_name == "production":
            print("⚠️  Security tests skipped in production environment")
            return 0
        
        return self.run_pytest([
            "-m", "security",
            "-v", "--tb=short"
        ])
    
    def run_all_tests(self, env_name: str, include_slow: bool = False) -> int:
        """Run all backend integration tests"""
        print(f"🚀 Running all backend integration tests for {env_name} environment")
        
        pytest_args = ["-v", "--tb=short"]
        
        # Skip slow tests unless explicitly requested
        if not include_slow:
            pytest_args.extend(["-m", "not slow"])
        
        # Skip rate limiting tests in production
        if env_name == "production":
            current_marker = pytest_args[-1] if pytest_args[-1].startswith("not ") else None
            if current_marker:
                pytest_args[-1] = f"{current_marker} and not rate_limit"
            else:
                pytest_args.extend(["-m", "not rate_limit"])
        
        return self.run_pytest(pytest_args)

def main():
    """Main test runner entry point"""
    parser = argparse.ArgumentParser(
        description="CFIPros Backend Integration Test Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_tests.py --env local --health-check
  python run_tests.py --env staging --contract-tests
  python run_tests.py --env production --all --no-slow
  python run_tests.py --list-tests
  python run_tests.py --install-deps
        """
    )
    
    # Environment selection
    parser.add_argument(
        "--env", "--environment",
        choices=["local", "staging", "production"],
        default="local",
        help="Test environment to run against (default: local)"
    )
    
    # Test execution modes
    test_group = parser.add_mutually_exclusive_group()
    test_group.add_argument(
        "--health-check",
        action="store_true",
        help="Run backend health check only"
    )
    test_group.add_argument(
        "--contract-tests", 
        action="store_true",
        help="Run API contract tests only"
    )
    test_group.add_argument(
        "--auth-tests",
        action="store_true", 
        help="Run authentication tests only"
    )
    test_group.add_argument(
        "--security-tests",
        action="store_true",
        help="Run security tests only"
    )
    test_group.add_argument(
        "--all",
        action="store_true",
        help="Run all integration tests (default)"
    )
    
    # Test configuration
    parser.add_argument(
        "--slow", 
        action="store_true",
        help="Include slow-running tests"
    )
    parser.add_argument(
        "--no-slow",
        action="store_true", 
        help="Exclude slow-running tests (default)"
    )
    
    # Utility commands
    parser.add_argument(
        "--install-deps", "--install",
        action="store_true",
        help="Install Python test dependencies"
    )
    parser.add_argument(
        "--force-install",
        action="store_true",
        help="Force reinstall all dependencies"
    )
    parser.add_argument(
        "--list-tests",
        action="store_true",
        help="List available tests and markers"
    )
    
    # Pass-through pytest arguments
    parser.add_argument(
        "pytest_args",
        nargs="*",
        help="Additional arguments to pass to pytest"
    )
    
    args = parser.parse_args()
    runner = TestRunner()
    
    # Handle utility commands first
    if args.install_deps or args.force_install:
        success = runner.install_dependencies(force=args.force_install)
        return 0 if success else 1
    
    if args.list_tests:
        runner.list_available_tests()
        return 0
    
    # Setup environment
    env_name = args.env
    print(f"🌍 Setting up {env_name} environment")
    print(f"   {runner.environments[env_name]['description']}")
    runner.setup_environment(env_name)
    
    # Determine test mode
    if args.health_check:
        return runner.run_health_check(env_name)
    elif args.contract_tests:
        return runner.run_contract_tests(env_name)
    elif args.auth_tests:
        return runner.run_authentication_tests(env_name)
    elif args.security_tests:
        return runner.run_security_tests(env_name)
    elif args.all:
        include_slow = args.slow and not args.no_slow
        return runner.run_all_tests(env_name, include_slow)
    elif args.pytest_args:
        # Pass through custom pytest arguments
        return runner.run_pytest(args.pytest_args)
    else:
        # Default: run all tests
        include_slow = args.slow and not args.no_slow
        return runner.run_all_tests(env_name, include_slow)

if __name__ == "__main__":
    sys.exit(main())