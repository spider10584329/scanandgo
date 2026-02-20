"""
MissingItem model
"""
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class MissingItem(Base):
    """Missing item tracking model"""
    __tablename__ = "missing_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, nullable=True, index=True)
    detail_location_id = Column(Integer, ForeignKey("detail_locations.id"), nullable=False)
    barcode = Column(String(255), nullable=True)

    # Relationships
    detail_location = relationship("DetailLocation")
