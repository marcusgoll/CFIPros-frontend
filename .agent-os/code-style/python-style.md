# Python Code Style Guide

## Overview
This guide defines Python coding standards for the CFI Pros API project, emphasizing readability, maintainability, and Pythonic best practices.

## Python Version
- **Minimum**: Python 3.8+
- **Recommended**: Python 3.10+ for latest features
- Use type hints throughout the codebase

## Code Formatting

### PEP 8 Compliance
Follow PEP 8 with these specific guidelines:

```python
# Line length: 88 characters (Black default)
# Indentation: 4 spaces
# Blank lines: 2 between top-level definitions, 1 between methods

class ExampleClass:
    """Class docstring."""
    
    def __init__(self, name: str, value: int) -> None:
        self.name = name
        self.value = value
    
    def calculate(self) -> float:
        """Method docstring."""
        return self.value * 2.0
```

### Import Organization
```python
# Standard library imports
import os
import sys
from datetime import datetime
from typing import List, Optional, Dict

# Third-party imports
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException

# Local imports
from app.models import User
from app.utils import validate_email
from app.constants import API_VERSION
```

## Naming Conventions

### Variables and Functions
```python
# Variables: snake_case
user_name = "John Doe"
total_count = 42
is_active = True

# Functions: snake_case
def calculate_total_price(items: List[Item]) -> float:
    """Calculate the total price of items."""
    return sum(item.price for item in items)

# Constants: UPPER_SNAKE_CASE
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30
API_BASE_URL = "https://api.cfipros.com"
```

### Classes and Exceptions
```python
# Classes: PascalCase
class UserAccount:
    """Represents a user account."""
    pass

class PaymentProcessor:
    """Handles payment processing."""
    pass

# Exceptions: PascalCase ending with Error/Exception
class ValidationError(Exception):
    """Raised when validation fails."""
    pass

class PaymentFailedException(Exception):
    """Raised when payment processing fails."""
    pass
```

## Type Hints

### Basic Types
```python
from typing import List, Dict, Optional, Union, Tuple, Any

def process_user(
    name: str,
    age: int,
    email: Optional[str] = None,
    tags: List[str] = None
) -> Dict[str, Any]:
    """Process user information."""
    tags = tags or []
    return {
        "name": name,
        "age": age,
        "email": email,
        "tags": tags
    }
```

### Complex Types
```python
from typing import TypedDict, Protocol, Literal
from datetime import datetime

class UserData(TypedDict):
    """Type definition for user data."""
    id: int
    name: str
    email: str
    created_at: datetime
    role: Literal["admin", "user", "guest"]

class Processable(Protocol):
    """Protocol for processable objects."""
    def process(self) -> bool:
        ...
```

## Documentation

### Docstrings (Google Style)
```python
def fetch_user_data(
    user_id: int,
    include_history: bool = False,
    cache_timeout: int = 300
) -> Optional[UserData]:
    """Fetch user data from the database.
    
    Args:
        user_id: The unique identifier of the user.
        include_history: Whether to include user history data.
        cache_timeout: Cache timeout in seconds.
    
    Returns:
        User data dictionary if found, None otherwise.
    
    Raises:
        DatabaseError: If database connection fails.
        ValidationError: If user_id is invalid.
    
    Example:
        >>> user = fetch_user_data(123, include_history=True)
        >>> print(user["name"])
    """
    pass
```

### Class Documentation
```python
class PaymentService:
    """Service for handling payment operations.
    
    This service provides methods for processing payments,
    refunds, and payment status queries.
    
    Attributes:
        api_key: The payment provider API key.
        timeout: Request timeout in seconds.
        retry_count: Number of retry attempts.
    
    Example:
        >>> service = PaymentService(api_key="secret")
        >>> result = service.process_payment(100.00, "USD")
    """
    
    def __init__(self, api_key: str, timeout: int = 30):
        """Initialize the payment service.
        
        Args:
            api_key: Payment provider API key.
            timeout: Request timeout in seconds.
        """
        self.api_key = api_key
        self.timeout = timeout
```

## Error Handling

### Exception Handling
```python
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def safe_divide(a: float, b: float) -> Optional[float]:
    """Safely divide two numbers."""
    try:
        return a / b
    except ZeroDivisionError:
        logger.warning(f"Division by zero attempted: {a} / {b}")
        return None
    except TypeError as e:
        logger.error(f"Type error in division: {e}")
        raise ValidationError(f"Invalid types for division: {type(a)}, {type(b)}")
```

### Custom Exceptions
```python
class APIError(Exception):
    """Base exception for API errors."""
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class NotFoundError(APIError):
    """Resource not found error."""
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} with id '{identifier}' not found",
            error_code="RESOURCE_NOT_FOUND"
        )
```

## Async/Await Patterns

### Async Functions
```python
import asyncio
from typing import List
import aiohttp

async def fetch_data(url: str) -> dict:
    """Fetch data from URL asynchronously."""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            response.raise_for_status()
            return await response.json()

async def fetch_multiple(urls: List[str]) -> List[dict]:
    """Fetch data from multiple URLs concurrently."""
    tasks = [fetch_data(url) for url in urls]
    return await asyncio.gather(*tasks, return_exceptions=True)
```

### Async Context Managers
```python
from contextlib import asynccontextmanager
import asyncpg

@asynccontextmanager
async def database_connection():
    """Async context manager for database connections."""
    conn = await asyncpg.connect("postgresql://localhost/db")
    try:
        yield conn
    finally:
        await conn.close()

# Usage
async def get_user(user_id: int):
    async with database_connection() as conn:
        return await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1", 
            user_id
        )
```

## Testing

### Unit Tests
```python
import pytest
from unittest.mock import Mock, patch
from datetime import datetime

class TestUserService:
    """Test suite for UserService."""
    
    @pytest.fixture
    def user_service(self):
        """Create a UserService instance for testing."""
        return UserService(db_connection=Mock())
    
    def test_create_user_success(self, user_service):
        """Test successful user creation."""
        # Arrange
        user_data = {"name": "John", "email": "john@example.com"}
        
        # Act
        result = user_service.create_user(**user_data)
        
        # Assert
        assert result.id is not None
        assert result.name == "John"
        assert result.created_at <= datetime.now()
    
    @patch("app.services.send_email")
    def test_send_welcome_email(self, mock_send, user_service):
        """Test welcome email is sent."""
        user = User(email="test@example.com")
        user_service.send_welcome_email(user)
        mock_send.assert_called_once_with(
            to="test@example.com",
            subject="Welcome!"
        )
```

### Async Tests
```python
import pytest
import asyncio

@pytest.mark.asyncio
async def test_async_fetch():
    """Test async data fetching."""
    result = await fetch_data("https://api.example.com/data")
    assert result["status"] == "success"
    assert len(result["items"]) > 0
```

## Performance Best Practices

### List Comprehensions vs Loops
```python
# Good: List comprehension for simple transformations
squares = [x**2 for x in range(10) if x % 2 == 0]

# Good: Generator for memory efficiency
large_data = (process(x) for x in huge_list)

# Good: Use built-in functions
total = sum(item.price for item in items)
```

### Efficient Data Structures
```python
from collections import defaultdict, Counter, deque
from functools import lru_cache

# Use defaultdict for grouping
groups = defaultdict(list)
for item in items:
    groups[item.category].append(item)

# Use Counter for counting
word_counts = Counter(text.split())

# Use lru_cache for expensive computations
@lru_cache(maxsize=128)
def expensive_calculation(n: int) -> int:
    """Cache results of expensive calculations."""
    return sum(i**2 for i in range(n))
```

## Code Organization

### Module Structure
```python
"""
module_name.py - Brief module description.

This module provides functionality for [purpose].
"""

# Imports
from __future__ import annotations
import logging
from typing import Optional

# Module-level logger
logger = logging.getLogger(__name__)

# Constants
DEFAULT_TIMEOUT = 30

# Private helper functions
def _validate_input(data: dict) -> bool:
    """Private validation function."""
    return all(key in data for key in ["id", "name"])

# Public API
class PublicClass:
    """Public class exposed by module."""
    pass

def public_function(param: str) -> str:
    """Public function exposed by module."""
    return param.upper()

# Module initialization
__all__ = ["PublicClass", "public_function"]
```

### Package Structure
```
package/
├── __init__.py       # Package initialization
├── models.py         # Data models
├── services.py       # Business logic
├── utils.py          # Utility functions
├── exceptions.py     # Custom exceptions
├── constants.py      # Constants and configuration
└── tests/
    ├── __init__.py
    ├── test_models.py
    └── test_services.py
```

## Security Considerations

### Input Validation
```python
import re
from typing import Optional

def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def sanitize_input(user_input: str) -> str:
    """Sanitize user input to prevent injection."""
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>&"\'`]', '', user_input)
    return sanitized.strip()
```

### Secure Practices
```python
import os
import secrets
from cryptography.fernet import Fernet

# Never hardcode secrets
API_KEY = os.environ.get("API_KEY")
if not API_KEY:
    raise ValueError("API_KEY environment variable not set")

# Use secrets for tokens
def generate_token() -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(32)

# Encrypt sensitive data
def encrypt_data(data: str, key: bytes) -> bytes:
    """Encrypt sensitive data."""
    f = Fernet(key)
    return f.encrypt(data.encode())
```

## Common Patterns

### Context Managers
```python
from contextlib import contextmanager
import time

@contextmanager
def timer(name: str):
    """Context manager for timing operations."""
    start = time.time()
    print(f"Starting {name}...")
    try:
        yield
    finally:
        elapsed = time.time() - start
        print(f"{name} took {elapsed:.2f} seconds")

# Usage
with timer("data_processing"):
    process_large_dataset()
```

### Decorators
```python
import functools
import time
from typing import Callable

def retry(max_attempts: int = 3, delay: float = 1.0):
    """Decorator for retrying failed operations."""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

@retry(max_attempts=3, delay=2.0)
def unreliable_api_call():
    """Make an API call that might fail."""
    pass
```

## Tools and Linting

### Required Tools
- **Black**: Code formatting
- **isort**: Import sorting
- **mypy**: Type checking
- **pylint** or **flake8**: Linting
- **pytest**: Testing framework

### Configuration (.pyproject.toml)
```toml
[tool.black]
line-length = 88
target-version = ['py38']

[tool.isort]
profile = "black"
line_length = 88

[tool.mypy]
python_version = "3.8"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
```

## Code Review Checklist
- [ ] Follows PEP 8 style guide
- [ ] Has appropriate type hints
- [ ] Includes comprehensive docstrings
- [ ] Handles errors appropriately
- [ ] Has corresponding unit tests
- [ ] No hardcoded secrets or credentials
- [ ] Uses appropriate data structures
- [ ] Avoids global state
- [ ] Functions are focused and single-purpose
- [ ] Code is DRY (Don't Repeat Yourself)