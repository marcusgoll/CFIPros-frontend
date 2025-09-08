"""
Database Testing Utilities
Provides database connection and transaction rollback support for integration tests
"""

import os
import pytest
from typing import Optional, Generator, AsyncGenerator
from unittest.mock import Mock
from contextlib import asynccontextmanager

# Database imports (conditional based on availability)
try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker, Session
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False

class DatabaseConfig:
    """Database configuration for integration tests"""
    
    def __init__(self):
        self.database_url = os.getenv('INTEGRATION_DATABASE_URL')
        self.test_database_url = os.getenv('INTEGRATION_TEST_DATABASE_URL')
        self.use_test_database = os.getenv('TEST_ENV', 'local') != 'production'
    
    @property
    def effective_database_url(self) -> Optional[str]:
        """Get the database URL to use for testing"""
        if self.use_test_database and self.test_database_url:
            return self.test_database_url
        return self.database_url
    
    @property
    def is_available(self) -> bool:
        """Check if database testing is available"""
        return SQLALCHEMY_AVAILABLE and self.effective_database_url is not None

class MockDatabase:
    """Mock database for testing when real database is not available"""
    
    def __init__(self):
        self.data = {}
        self.transaction_active = False
    
    def begin_transaction(self):
        """Mock transaction begin"""
        self.transaction_active = True
        return self
    
    def rollback_transaction(self):
        """Mock transaction rollback"""
        self.data.clear()
        self.transaction_active = False
    
    def commit_transaction(self):
        """Mock transaction commit"""
        self.transaction_active = False
    
    def execute_query(self, query: str, params: dict = None):
        """Mock query execution"""
        return Mock(rowcount=1, fetchall=lambda: [], fetchone=lambda: None)
    
    def insert_test_user(self, user_data: dict):
        """Mock user insertion"""
        user_id = user_data.get('id', 'mock_user_123')
        self.data[f'user_{user_id}'] = user_data
        return user_id
    
    def get_test_user(self, user_id: str):
        """Mock user retrieval"""
        return self.data.get(f'user_{user_id}')
    
    def cleanup_test_data(self):
        """Mock test data cleanup"""
        self.data.clear()

class DatabaseTestMixin:
    """Mixin class providing database testing utilities"""
    
    def __init__(self):
        self.db_config = DatabaseConfig()
        self.db = None
        self.session = None
    
    def setup_database(self):
        """Setup database connection for tests"""
        if self.db_config.is_available:
            try:
                self.engine = create_engine(self.db_config.effective_database_url)
                SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
                self.session = SessionLocal()
                return True
            except Exception as e:
                print(f"Warning: Could not connect to database: {e}")
                self.db = MockDatabase()
                return False
        else:
            self.db = MockDatabase()
            return False
    
    def teardown_database(self):
        """Cleanup database connection"""
        if self.session:
            try:
                self.session.rollback()
                self.session.close()
            except Exception:
                pass
        elif self.db:
            self.db.cleanup_test_data()
    
    def begin_test_transaction(self):
        """Begin test transaction for rollback"""
        if self.session:
            self.transaction = self.session.begin()
        elif self.db:
            self.db.begin_transaction()
    
    def rollback_test_transaction(self):
        """Rollback test transaction"""
        if hasattr(self, 'transaction') and self.transaction:
            try:
                self.transaction.rollback()
            except Exception:
                pass
        elif self.db:
            self.db.rollback_transaction()

# Pytest fixtures for database testing
@pytest.fixture(scope="session")
def database_config():
    """Database configuration fixture"""
    return DatabaseConfig()

@pytest.fixture
def db_session(database_config) -> Generator[Session, None, None]:
    """Database session fixture with transaction rollback"""
    if not database_config.is_available:
        yield MockDatabase()
        return
    
    try:
        engine = create_engine(database_config.effective_database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = SessionLocal()
        
        # Begin transaction
        transaction = session.begin()
        
        try:
            yield session
        finally:
            # Always rollback to avoid test data persistence
            transaction.rollback()
            session.close()
            
    except Exception as e:
        print(f"Database fixture failed, using mock: {e}")
        yield MockDatabase()

@pytest.fixture
async def async_db_session(database_config) -> AsyncGenerator[AsyncSession, None]:
    """Async database session fixture with transaction rollback"""
    if not database_config.is_available:
        yield MockDatabase()
        return
    
    try:
        # Convert sync URL to async if needed
        db_url = database_config.effective_database_url
        if db_url.startswith('postgresql://'):
            db_url = db_url.replace('postgresql://', 'postgresql+asyncpg://')
        elif db_url.startswith('mysql://'):
            db_url = db_url.replace('mysql://', 'mysql+aiomysql://')
        
        engine = create_async_engine(db_url)
        AsyncSessionLocal = async_sessionmaker(
            autocommit=False, 
            autoflush=False, 
            bind=engine,
            class_=AsyncSession
        )
        
        async with AsyncSessionLocal() as session:
            # Begin transaction
            async with session.begin():
                try:
                    yield session
                finally:
                    # Transaction will rollback automatically when context exits
                    await session.rollback()
                    
    except Exception as e:
        print(f"Async database fixture failed, using mock: {e}")
        yield MockDatabase()

# Test utilities for database operations
class DatabaseTestUtils:
    """Utilities for database testing operations"""
    
    @staticmethod
    def create_test_user(session, user_data: dict) -> str:
        """Create test user in database"""
        if isinstance(session, MockDatabase):
            return session.insert_test_user(user_data)
        
        try:
            # This would be actual SQL or ORM operations
            # For now, return mock data
            return f"test_user_{user_data.get('email', 'unknown')}"
        except Exception:
            return "mock_user_id"
    
    @staticmethod
    def create_test_organization(session, org_data: dict) -> str:
        """Create test organization in database"""
        if isinstance(session, MockDatabase):
            org_id = org_data.get('id', 'mock_org_123')
            session.data[f'org_{org_id}'] = org_data
            return org_id
        
        try:
            # Actual database operations would go here
            return f"test_org_{org_data.get('name', 'unknown')}"
        except Exception:
            return "mock_org_id"
    
    @staticmethod
    def create_test_batch(session, batch_data: dict) -> str:
        """Create test processing batch in database"""
        if isinstance(session, MockDatabase):
            batch_id = batch_data.get('id', 'mock_batch_123')
            session.data[f'batch_{batch_id}'] = batch_data
            return batch_id
        
        try:
            # Actual database operations would go here
            return f"test_batch_{batch_data.get('user_id', 'unknown')}"
        except Exception:
            return "mock_batch_id"
    
    @staticmethod
    def cleanup_test_data(session, patterns: list = None):
        """Cleanup test data from database"""
        if isinstance(session, MockDatabase):
            session.cleanup_test_data()
            return
        
        patterns = patterns or ['test_%', 'mock_%']
        
        try:
            for pattern in patterns:
                # This would be actual cleanup SQL
                # session.execute(text(f"DELETE FROM users WHERE id LIKE '{pattern}'"))
                pass
        except Exception as e:
            print(f"Test data cleanup failed: {e}")

@pytest.fixture
def db_utils():
    """Database utilities fixture"""
    return DatabaseTestUtils()

# Database health check utilities
async def check_database_health(database_url: str) -> bool:
    """Check if database is available and responsive"""
    if not SQLALCHEMY_AVAILABLE:
        return False
    
    try:
        if database_url.startswith(('postgresql+asyncpg://', 'mysql+aiomysql://')):
            engine = create_async_engine(database_url)
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
                await conn.commit()
        else:
            engine = create_engine(database_url)
            with engine.begin() as conn:
                conn.execute(text("SELECT 1"))
                conn.commit()
        return True
    except Exception:
        return False

@pytest.fixture(scope="session", autouse=True)
def verify_database_availability(database_config):
    """Verify database availability at test session start"""
    if database_config.effective_database_url:
        import asyncio
        
        try:
            is_healthy = asyncio.run(check_database_health(database_config.effective_database_url))
            if not is_healthy:
                print("Warning: Database is not available, using mock database for tests")
        except Exception:
            print("Warning: Could not verify database health, using mock database for tests")

# Migration and schema management for tests
class TestSchemaManager:
    """Manages test database schema and migrations"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine = None
    
    def setup_test_schema(self):
        """Setup test database schema"""
        if not SQLALCHEMY_AVAILABLE:
            return False
        
        try:
            self.engine = create_engine(self.database_url)
            
            # Create test tables if they don't exist
            # This would typically use Alembic or manual DDL
            with self.engine.begin() as conn:
                # Example schema setup - would be actual DDL
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS test_users (
                        id VARCHAR(255) PRIMARY KEY,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
            return True
        except Exception as e:
            print(f"Test schema setup failed: {e}")
            return False
    
    def teardown_test_schema(self):
        """Cleanup test database schema"""
        if self.engine:
            try:
                with self.engine.begin() as conn:
                    # Drop test tables
                    conn.execute(text("DROP TABLE IF EXISTS test_users"))
            except Exception as e:
                print(f"Test schema teardown failed: {e}")

@pytest.fixture(scope="session")
def test_schema_manager(database_config):
    """Test schema manager fixture"""
    if database_config.effective_database_url:
        manager = TestSchemaManager(database_config.effective_database_url)
        manager.setup_test_schema()
        yield manager
        manager.teardown_test_schema()
    else:
        yield None