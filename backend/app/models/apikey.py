"""
APIKey model
"""
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.database import Base


class APIKey(Base):
    """API Key model for external API authentication"""
    __tablename__ = "apikey"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, nullable=False, index=True)
    api_key = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
