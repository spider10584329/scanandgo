"""
Agent model - device/agent registration per customer
"""
from sqlalchemy import Column, Integer, String
from app.database import Base


class Agent(Base):
    """Agent model - links device_id to customer"""
    __tablename__ = "agents"

    agents_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(255), nullable=False, index=True)
    customer_id = Column(Integer, nullable=False, index=True)
