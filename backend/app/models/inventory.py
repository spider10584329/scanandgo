"""
Inventory model
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Inventory(Base):
    """Inventory model - main asset tracking table"""
    __tablename__ = "inventories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=True)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=True)
    floor_id = Column(Integer, ForeignKey("floors.id"), nullable=True)
    detail_location_id = Column(Integer, ForeignKey("detail_locations.id"), nullable=True)
    purchase_date = Column(String(120), nullable=True)
    last_date = Column(String(120), nullable=True)
    ref_client = Column(String(120), nullable=True)
    status = Column(Integer, nullable=True)  # 1=Active, 2=Maintenance, 3=Inactive, 4=Missing
    reg_date = Column(String(120), nullable=True)
    inv_date = Column(String(120), nullable=True)
    comment = Column(String(120), nullable=True)
    rfid = Column(String(120), nullable=True)
    barcode = Column(String(120), nullable=True)
    operator_id = Column(Integer, ForeignKey("operators.id"), nullable=True)
    room_assignment = Column(String(120), nullable=True)
    category_df_immonet = Column(String(120), nullable=True)
    purchase_amount = Column(Integer, nullable=True)
    is_throw = Column(Boolean, nullable=True)

    # Relationships
    category = relationship("Category", back_populates="inventories")
    item = relationship("Item", back_populates="inventories")
    building = relationship("Building", back_populates="inventories")
    area = relationship("Area", back_populates="inventories")
    floor = relationship("Floor", back_populates="inventories")
    detail_location = relationship("DetailLocation", back_populates="inventories")
    operator = relationship("Operator", back_populates="inventories")
