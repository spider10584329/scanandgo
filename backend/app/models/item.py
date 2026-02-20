"""
Item model
"""
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Item(Base):
    """Item model for inventory items"""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    name = Column(String(120), nullable=False)
    barcode = Column(String(120), nullable=True)

    # Relationships
    category = relationship("Category", back_populates="items")
    inventories = relationship("Inventory", back_populates="item")
