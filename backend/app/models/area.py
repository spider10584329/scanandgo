"""
Area model
"""
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Area(Base):
    """Area model for location hierarchy"""
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, nullable=False, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=True)
    name = Column(String(120), nullable=False)

    # Relationships
    building = relationship("Building", back_populates="areas")
    floors = relationship("Floor", back_populates="area")
    inventories = relationship("Inventory", back_populates="area")
