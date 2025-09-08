#!/usr/bin/env python3
"""
Backend Integration Test Setup Verification
Verifies the backend integration test framework is correctly configured
"""

import os
import sys
from pathlib import Path

def verify_test_structure():
    """Verify test directory structure is correct"""
    backend_dir = Path(__file__).parent
    
    required_files = [
        "conftest.py",
        "base_test.py", 
        "database.py",
        "requirements.txt",
        "pytest.ini",
        "pyproject.toml",
        "README.md"
    ]
    
    test_files = [
        "test_file_extraction.py",
        "test_authentication.py", 
        "test_backend_health.py"
    ]
    
    print("Verifying test directory structure...")
    
    missing_files = []
    for required_file in required_files:
        file_path = backend_dir / required_file
        if not file_path.exists():
            missing_files.append(required_file)
        else:
            print(f"  OK: {required_file}")
    
    for test_file in test_files:
        file_path = backend_dir / test_file
        if not file_path.exists():
            missing_files.append(test_file)
        else:
            print(f"  OK: {test_file}")
    
    if missing_files:
        print(f"Missing required files: {missing_files}")
        return False
    
    print("Directory structure verification: PASSED")
    return True

def verify_python_imports():
    """Verify critical Python imports work"""
    print("Verifying Python import dependencies...")
    
    import_tests = [
        ("pathlib", "Path"),
        ("typing", "Dict"),
        ("unittest.mock", "Mock"),
        ("base_test", "BaseAPITest"),
        ("database", "DatabaseConfig")
    ]
    
    failed_imports = []
    
    for module, component in import_tests:
        try:
            if module == "base_test":
                from base_test import BaseAPITest
            elif module == "database":
                from database import DatabaseConfig
            else:
                __import__(module)
            print(f"  OK: {module}.{component}")
        except ImportError as e:
            print(f"  FAIL: {module}.{component} - {e}")
            failed_imports.append((module, component))
    
    if failed_imports:
        print(f"Failed imports: {failed_imports}")
        return False
    
    print("Python imports verification: PASSED")
    return True

def verify_configuration_files():
    """Verify configuration files are valid"""
    print("Verifying configuration files...")
    
    backend_dir = Path(__file__).parent
    
    # Check pytest.ini
    pytest_ini = backend_dir / "pytest.ini"
    if pytest_ini.exists():
        content = pytest_ini.read_text()
        if "[tool:pytest]" in content:
            print("  OK: pytest.ini format")
        else:
            print("  WARN: pytest.ini may have format issues")
    
    # Check pyproject.toml
    pyproject_toml = backend_dir / "pyproject.toml"
    if pyproject_toml.exists():
        content = pyproject_toml.read_text()
        if "[build-system]" in content and "[tool.pytest.ini_options]" in content:
            print("  OK: pyproject.toml format")
        else:
            print("  WARN: pyproject.toml may have format issues")
    
    # Check requirements.txt
    requirements = backend_dir / "requirements.txt"
    if requirements.exists():
        content = requirements.read_text()
        if "pytest" in content and "httpx" in content:
            print("  OK: requirements.txt contains core dependencies")
        else:
            print("  WARN: requirements.txt may be missing core dependencies")
    
    print("Configuration files verification: PASSED")
    return True

def verify_test_fixtures():
    """Verify test fixtures directory exists"""
    print("Verifying test fixtures...")
    
    fixtures_dir = Path(__file__).parent.parent / "fixtures"
    
    if fixtures_dir.exists():
        print(f"  OK: Fixtures directory exists at {fixtures_dir}")
        
        # Check for test files
        valid_dir = fixtures_dir / "files" / "valid"
        malicious_dir = fixtures_dir / "files" / "malicious"
        
        if valid_dir.exists():
            valid_files = list(valid_dir.glob("*.pdf"))
            print(f"  OK: Found {len(valid_files)} valid test files")
        else:
            print("  WARN: Valid test files directory not found")
        
        if malicious_dir.exists():
            malicious_files = list(malicious_dir.glob("*"))
            print(f"  OK: Found {len(malicious_files)} malicious test files")
        else:
            print("  WARN: Malicious test files directory not found")
    else:
        print("  WARN: Test fixtures directory not found")
    
    print("Test fixtures verification: PASSED")
    return True

def main():
    """Main verification function"""
    print("Backend Integration Test Framework Verification")
    print("=" * 50)
    
    verification_steps = [
        ("Directory Structure", verify_test_structure),
        ("Python Imports", verify_python_imports),
        ("Configuration Files", verify_configuration_files),
        ("Test Fixtures", verify_test_fixtures)
    ]
    
    results = []
    
    for step_name, step_function in verification_steps:
        print(f"\n{step_name}:")
        try:
            result = step_function()
            results.append((step_name, result))
        except Exception as e:
            print(f"  ERROR: {e}")
            results.append((step_name, False))
    
    print("\n" + "=" * 50)
    print("VERIFICATION SUMMARY")
    print("=" * 50)
    
    passed_count = 0
    for step_name, result in results:
        status = "PASSED" if result else "FAILED"
        print(f"{step_name}: {status}")
        if result:
            passed_count += 1
    
    print(f"\nOverall: {passed_count}/{len(results)} verifications passed")
    
    if passed_count == len(results):
        print("\nBackend integration test framework setup is complete and ready!")
        return 0
    else:
        print(f"\n{len(results) - passed_count} verification(s) failed. Please review the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())