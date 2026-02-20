"""
Snapshot model
"""
from sqlalchemy import Column, Integer, String
from app.database import Base


class Snapshot(Base):
    """Snapshot model for inventory snapshots"""
    __tablename__ = "snapshots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, nullable=False, index=True)
    name = Column(String(120), nullable=True)
    date = Column(String(120), nullable=True)
