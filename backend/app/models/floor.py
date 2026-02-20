"""
Floor model
"""
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Floor(Base):
    """Floor model for location hierarchy"""
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, nullable=False, index=True)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=True)
    name = Column(String(120), nullable=False)

    # Relationships
    area = relationship("Area", back_populates="floors")
    detail_locations = relationship("DetailLocation", back_populates="floor")
    inventories = relationship("Inventory", back_populates="floor")
