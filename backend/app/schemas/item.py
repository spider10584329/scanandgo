"""
Item and Category schemas
"""
from pydantic import BaseModel
from typing import Optional


# Category schemas
class CategoryBase(BaseModel):
    """Base category schema"""
    name: str


class CategoryCreate(CategoryBase):
    """Create category schema"""
    pass


class CategoryUpdate(BaseModel):
    """Update category schema"""
    id: Optional[int] = None
    name: str


class CategoryResponse(CategoryBase):
    """Category response schema"""
    id: int
    customer_id: int

    class Config:
        from_attributes = True


# Item schemas
class ItemBase(BaseModel):
    """Base item schema"""
    name: str
    barcode: Optional[str] = None
    category_id: Optional[int] = None


class ItemCreate(ItemBase):
    """Create item schema"""
    pass


class ItemUpdate(BaseModel):
    """Update item schema"""
    id: Optional[int] = None
    name: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[int] = None


class ItemResponse(ItemBase):
    """Item response schema"""
    id: int
    customer_id: int
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True
