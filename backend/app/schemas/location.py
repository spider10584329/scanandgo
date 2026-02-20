"""
Location schemas (Building, Area, Floor, DetailLocation)
"""
from pydantic import BaseModel
from typing import Optional


# Building schemas
class BuildingBase(BaseModel):
    """Base building schema"""
    name: str


class BuildingCreate(BuildingBase):
    """Create building schema"""
    pass


class BuildingUpdate(BaseModel):
    """Update building schema"""
    id: Optional[int] = None
    name: str


class BuildingResponse(BuildingBase):
    """Building response schema"""
    id: int
    customer_id: int

    class Config:
        from_attributes = True


# Area schemas
class AreaBase(BaseModel):
    """Base area schema"""
    name: str
    building_id: Optional[int] = None


class AreaCreate(AreaBase):
    """Create area schema"""
    pass


class AreaUpdate(BaseModel):
    """Update area schema"""
    id: Optional[int] = None
    name: Optional[str] = None
    building_id: Optional[int] = None


class AreaResponse(AreaBase):
    """Area response schema"""
    id: int
    customer_id: int

    class Config:
        from_attributes = True


# Floor schemas
class FloorBase(BaseModel):
    """Base floor schema"""
    name: str
    area_id: Optional[int] = None


class FloorCreate(FloorBase):
    """Create floor schema"""
    pass


class FloorUpdate(BaseModel):
    """Update floor schema"""
    id: Optional[int] = None
    name: Optional[str] = None
    area_id: Optional[int] = None


class FloorResponse(FloorBase):
    """Floor response schema"""
    id: int
    customer_id: int

    class Config:
        from_attributes = True


# DetailLocation schemas
class DetailLocationBase(BaseModel):
    """Base detail location schema"""
    name: str
    floor_id: Optional[int] = None
    img_data: Optional[str] = None


class DetailLocationCreate(DetailLocationBase):
    """Create detail location schema"""
    pass


class DetailLocationUpdate(BaseModel):
    """Update detail location schema"""
    id: Optional[int] = None
    name: Optional[str] = None
    floor_id: Optional[int] = None
    img_data: Optional[str] = None


class DetailLocationResponse(DetailLocationBase):
    """Detail location response schema"""
    id: int
    customer_id: int

    class Config:
        from_attributes = True
