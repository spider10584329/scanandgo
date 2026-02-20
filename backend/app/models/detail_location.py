"""
DetailLocation model
"""
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class DetailLocation(Base):
    """Detail location model for specific location within floor"""
    __tablename__ = "detail_locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, nullable=False, index=True)
    floor_id = Column(Integer, ForeignKey("floors.id"), nullable=True)
    name = Column(String(120), nullable=False)
    img_data = Column(String(120), nullable=True)

    # Relationships
    floor = relationship("Floor", back_populates="detail_locations")
    inventories = relationship("Inventory", back_populates="detail_location")
