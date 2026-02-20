"""
Category model
"""
from sqlalchemy import Column, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Category(Base):
    """Category model for item classification"""
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint('customer_id', 'name', name='uq_customer_category_name'),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, nullable=False, index=True)
    name = Column(String(120), nullable=False)

    # Relationships
    items = relationship("Item", back_populates="category")
    inventories = relationship("Inventory", back_populates="category")
