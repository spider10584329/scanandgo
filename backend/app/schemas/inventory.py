"""
Inventory schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from app.schemas.item import ItemResponse, CategoryResponse
from app.schemas.location import BuildingResponse, AreaResponse, FloorResponse, DetailLocationResponse


class InventoryBase(BaseModel):
    """Base inventory schema"""
    category_id: Optional[int] = None
    item_id: Optional[int] = None
    building_id: Optional[int] = None
    area_id: Optional[int] = None
    floor_id: Optional[int] = None
    detail_location_id: Optional[int] = None
    barcode: Optional[str] = None
    status: Optional[int] = 1
    purchase_date: Optional[str] = None
    purchase_amount: Optional[int] = None
    comment: Optional[str] = None
    is_throw: Optional[bool] = False


class InventoryCreate(InventoryBase):
    """Create inventory schema"""
    customer_id: int
    items: List[dict]  # List of {id, category_id}
    locationData: Optional[dict] = None


class InventoryUpdate(BaseModel):
    """Update inventory schema"""
    category_id: Optional[int] = None
    item_id: Optional[int] = None
    building_id: Optional[int] = None
    area_id: Optional[int] = None
    floor_id: Optional[int] = None
    detail_location_id: Optional[int] = None
    barcode: Optional[str] = None
    status: Optional[int] = None
    comment: Optional[str] = None
    is_throw: Optional[bool] = None


class InventoryMoveRequest(BaseModel):
    """Move inventory location"""
    inventoryIds: List[int]
    newLocation: dict  # {buildingId, areaId, floorId, detailLocationId}


class InventoryResponse(InventoryBase):
    """Inventory response schema"""
    id: int
    customer_id: int
    reg_date: Optional[str] = None
    inv_date: Optional[str] = None
    operator_id: Optional[int] = None

    # Related objects
    item: Optional[ItemResponse] = None
    category: Optional[CategoryResponse] = None
    building: Optional[BuildingResponse] = None
    area: Optional[AreaResponse] = None
    floor: Optional[FloorResponse] = None
    detail_location: Optional[DetailLocationResponse] = None

    class Config:
        from_attributes = True


class InventoryStatusSummary(BaseModel):
    """Inventory status summary"""
    active: int
    maintenance: int
    inactive: int
    missing: int
    total: int


class LocationAnalytics(BaseModel):
    """Location-based analytics"""
    location: str
    count: int
    percentage: float


class SearchResult(BaseModel):
    """Search result item"""
    id: int
    itemName: str
    barcode: str
    location: str
    status: str
    statusColor: str
    isThrow: str
    deploymentDate: str
    category: str


class MissingItemCreate(BaseModel):
    """Create missing item"""
    customer_id: int
    detail_location_id: int
    barcode: Optional[str] = None


class MissingItemResponse(BaseModel):
    """Missing item response"""
    id: int
    customer_id: int
    detail_location_id: int
    barcode: Optional[str] = None

    class Config:
        from_attributes = True
