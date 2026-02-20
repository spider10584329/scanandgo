"""
Building model
"""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Building(Base):
    """Building model for location hierarchy"""
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, nullable=False, index=True)
    name = Column(String(120), unique=True, nullable=False)

    # Relationships
    areas = relationship("Area", back_populates="building")
    inventories = relationship("Inventory", back_populates="building")
