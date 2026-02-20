"""
Operator model (agents/staff users)
"""
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Operator(Base):
    """Operator/Agent model"""
    __tablename__ = "operators"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, nullable=False, index=True)
    username = Column(String(120), unique=True, nullable=False)
    password = Column(String(120), nullable=False)
    passwordRequest = Column(String(255), nullable=True)
    isPasswordRequest = Column(Integer, nullable=True)
    isActive = Column(Integer, default=0, nullable=True)

    # Relationships
    inventories = relationship("Inventory", back_populates="operator")
