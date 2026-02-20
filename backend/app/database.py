"""
Database configuration and session management
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from typing import Generator
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Create database engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=20,  # Increased for multi-worker environment (workers * concurrent_requests)
    max_overflow=30,  # Maximum overflow connections
    pool_recycle=1800,  # Recycle connections every 30 minutes (more conservative)
    pool_timeout=30,  # Wait up to 30 seconds for a connection
    echo=settings.ENVIRONMENT == "development",  # Log SQL in dev
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models (SQLAlchemy 2.0 compatible)
class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for getting database session

    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()  # Rollback on any exception
        raise
    finally:
        db.expunge_all()  # Detach all objects from session
        db.close()  # Return connection to pool


def init_db():
    """Initialize database (create tables if needed)"""
    try:
        # Import all models to ensure they're registered
        from app.models import (
            user, operator, inventory, item, category,
            building, area, floor, detail_location,
            missing_item, snapshot, apikey, agent
        )

        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


def test_db_connection() -> bool:
    """
    Test database connectivity

    Returns:
        True if connection successful, False otherwise
    """
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))  # SQLAlchemy 2.0 requires text()
        logger.info("Database connection test successful")
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False
    finally:
        db.close()  # Always close connection, even on exception
