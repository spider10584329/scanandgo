"""
Android app API schemas - request/response shapes matching the app DTOs.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# --- Location (read) responses ---
class AndroidBuilding(BaseModel):
    id: int
    name: str


class AndroidArea(BaseModel):
    id: int
    name: str
    building_id: int


class AndroidFloor(BaseModel):
    id: int
    name: str
    area_id: int


class AndroidDetailLocation(BaseModel):
    id: int
    name: str
    img_data: Optional[str] = None


# --- Category / Item ---
class AndroidCategory(BaseModel):
    id: int
    name: str


class AndroidItem(BaseModel):
    id: int
    name: str
    category_id: int
    barcode: Optional[str] = None


# --- Category/Item create/update requests ---
class AndroidPostCategory(BaseModel):
    name: str


class AndroidPostItem(BaseModel):
    name: str
    categoryId: int
    barcode: Optional[str] = None


class AndroidItemUpdateRequest(BaseModel):
    """Partial update: app may send only name (e.g. from PostCategory)."""
    name: Optional[str] = None
    categoryId: Optional[int] = None
    barcode: Optional[str] = None


# --- Status/Message responses ---
class AndroidStatusVM(BaseModel):
    status: int


class AndroidMessageVM(BaseModel):
    message: str


# --- Inventory barcode list ---
class AndroidPostCheckItem(BaseModel):
    barcode_list: List[str] = []


class AndroidResponseCheckItem(BaseModel):
    id: Optional[int] = None
    item_name: Optional[str] = None
    category_name: Optional[str] = None
    building_name: Optional[str] = None
    area_name: Optional[str] = None
    floor_name: Optional[str] = None
    detail_location_name: Optional[str] = None
    purchase_date: Optional[str] = None
    last_date: Optional[str] = None
    ref_client: Optional[str] = None
    reg_date: Optional[str] = None
    status: Optional[int] = None
    comment: Optional[str] = None
    barcode: Optional[str] = None
    username: Optional[str] = None
    room_assignment: Optional[str] = None
    category_df_immonet: Optional[str] = None
    purchase_amount: Optional[str] = None
    imgUrl: Optional[str] = None


# --- Detect barcode (PostInventory) request ---
class AndroidPostInventory(BaseModel):
    barcode: Optional[str] = None
    status: Optional[int] = None
    photo: Optional[str] = None
    comment: Optional[str] = None
    category_id: Optional[int] = None
    item_id: Optional[int] = None
    building_id: Optional[int] = None
    area_id: Optional[int] = None
    floor_id: Optional[int] = None
    detail_location_id: Optional[int] = None


class AndroidDetectBarcodeRequest(BaseModel):
    """
    Unified request for /inventory/detect/barcode.
    Accepts either:
    - Single barcode mode: {"barcode": "BC001"} (AndroidPostInventory shape)
    - List mode: {"detail_location_id": 5, "barcode_list": ["BC001", "BC002"]} (PostCheckTags shape)
    """
    # Single barcode mode (existing AndroidPostInventory shape)
    barcode: Optional[str] = None
    status: Optional[int] = None
    photo: Optional[str] = None
    comment: Optional[str] = None
    category_id: Optional[int] = None
    item_id: Optional[int] = None
    building_id: Optional[int] = None
    area_id: Optional[int] = None
    floor_id: Optional[int] = None
    detail_location_id: Optional[int] = None

    # List mode (PostCheckTags shape)
    barcode_list: Optional[List[str]] = None


class AndroidResponseCheckTag(BaseModel):
    right_list: List[str] = []
    wrong_list: List[str] = []
    missing_list: List[str] = []
    unknown_list: List[str] = []


# --- Update location (inventory/location/barcode) ---
class AndroidUpdateLocation(BaseModel):
    barcode_list: List[str] = []
    building_id: int = 0
    area_id: int = 0
    floor_id: int = 0
    block_id: int = 0


class AndroidFixLocationStatusVM(BaseModel):
    status: int
    message: str


# --- Missing item ---
class AndroidPostAddMissingItem(BaseModel):
    locationId: int
    barcode_list: List[str] = []


# --- QR code ---
class AndroidPostQRCode(BaseModel):
    name: str


class AndroidQrReturn(BaseModel):
    building_id: int = -1
    area_id: int = -1
    floor_id: int = -1
    block_id: int = -1
