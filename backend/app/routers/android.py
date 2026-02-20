"""
Android app API routes - exact paths and shapes expected by the ScanAndGo Android app.
All routes require Authorization: Bearer <token> (from POST /api/user/signin) except user/signin.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models.building import Building
from app.models.area import Area
from app.models.floor import Floor
from app.models.detail_location import DetailLocation
from app.models.category import Category
from app.models.item import Item
from app.models.inventory import Inventory
from app.models.operator import Operator
from app.schemas.android import (
    AndroidBuilding,
    AndroidArea,
    AndroidFloor,
    AndroidDetailLocation,
    AndroidCategory,
    AndroidItem,
    AndroidPostCategory,
    AndroidPostItem,
    AndroidStatusVM,
    AndroidMessageVM,
    AndroidPostCheckItem,
    AndroidResponseCheckItem,
    AndroidPostInventory,
    AndroidResponseCheckTag,
    AndroidUpdateLocation,
    AndroidFixLocationStatusVM,
    AndroidPostAddMissingItem,
    AndroidPostQRCode,
    AndroidQrReturn,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["Android App"])


# --- Locations (read-only) ---

@router.get("/building/read", response_model=List[AndroidBuilding])
async def android_building_read(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: list all buildings."""
    rows = (
        db.query(Building)
        .filter(Building.customer_id == current_user.customerId)
        .order_by(Building.name)
        .all()
    )
    return [AndroidBuilding(id=b.id, name=b.name) for b in rows]


@router.get("/area/read", response_model=List[AndroidArea])
async def android_area_read(
    id: Optional[int] = Query(None, description="buildingId"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: list areas (optionally for building id)."""
    query = db.query(Area).filter(Area.customer_id == current_user.customerId)
    if id is not None:
        query = query.filter(Area.building_id == id)
    rows = query.order_by(Area.name).all()
    return [
        AndroidArea(id=a.id, name=a.name, building_id=a.building_id or 0)
        for a in rows
    ]


@router.get("/floor/read", response_model=List[AndroidFloor])
async def android_floor_read(
    id: Optional[int] = Query(None, description="areaId"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: list floors (optionally for area id)."""
    query = db.query(Floor).filter(Floor.customer_id == current_user.customerId)
    if id is not None:
        query = query.filter(Floor.area_id == id)
    rows = query.order_by(Floor.name).all()
    return [
        AndroidFloor(id=f.id, name=f.name, area_id=f.area_id or 0)
        for f in rows
    ]


@router.get("/detaillocation/read", response_model=AndroidDetailLocation)
async def android_detaillocation_read(
    id: int = Query(..., description="detailLocationId"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: get one detail location by id."""
    row = (
        db.query(DetailLocation)
        .filter(
            DetailLocation.id == id,
            DetailLocation.customer_id == current_user.customerId,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Detail location not found")
    return AndroidDetailLocation(
        id=row.id,
        name=row.name,
        img_data=row.img_data,
    )


@router.get("/detaillocation/readall", response_model=List[AndroidDetailLocation])
async def android_detaillocation_readall(
    id: Optional[int] = Query(None, description="floorId"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: list detail locations (optionally for floor id)."""
    query = db.query(DetailLocation).filter(
        DetailLocation.customer_id == current_user.customerId
    )
    if id is not None:
        query = query.filter(DetailLocation.floor_id == id)
    rows = query.order_by(DetailLocation.name).all()
    return [
        AndroidDetailLocation(id=d.id, name=d.name, img_data=d.img_data)
        for d in rows
    ]


# --- Categories ---

@router.get("/category/read", response_model=List[AndroidCategory])
async def android_category_read(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: list all categories."""
    rows = (
        db.query(Category)
        .filter(Category.customer_id == current_user.customerId)
        .order_by(Category.name)
        .all()
    )
    return [AndroidCategory(id=c.id, name=c.name) for c in rows]


@router.post("/category/create", response_model=AndroidStatusVM)
async def android_category_create(
    request: AndroidPostCategory,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: create category. Returns status (1 = success)."""
    existing = (
        db.query(Category)
        .filter(
            Category.customer_id == current_user.customerId,
            Category.name == request.name,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Category name already exists")
    cat = Category(customer_id=current_user.customerId, name=request.name)
    db.add(cat)
    db.commit()
    return AndroidStatusVM(status=1)


@router.put("/category/update", response_model=AndroidMessageVM)
async def android_category_update(
    request: AndroidPostCategory,
    id: int = Query(..., description="category id"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: update category by id."""
    cat = (
        db.query(Category)
        .filter(
            Category.id == id,
            Category.customer_id == current_user.customerId,
        )
        .first()
    )
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.name = request.name
    db.commit()
    return AndroidMessageVM(message="OK")


# --- Items ---

@router.get("/item/read", response_model=List[AndroidItem])
async def android_item_read(
    id: Optional[int] = Query(None, description="categoryId"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: list items (optionally for category id)."""
    query = db.query(Item).filter(Item.customer_id == current_user.customerId)
    if id is not None:
        query = query.filter(Item.category_id == id)
    rows = query.order_by(Item.name).all()
    return [
        AndroidItem(
            id=i.id,
            name=i.name,
            category_id=i.category_id or 0,
            barcode=i.barcode,
        )
        for i in rows
    ]


@router.post("/item/create", response_model=AndroidStatusVM)
async def android_item_create(
    request: AndroidPostItem,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: create item. Returns status (1 = success)."""
    existing = (
        db.query(Item)
        .filter(
            Item.customer_id == current_user.customerId,
            Item.barcode == request.barcode,
        )
        .first()
    )
    if existing and request.barcode:
        raise HTTPException(status_code=409, detail="Barcode already exists")
    item = Item(
        customer_id=current_user.customerId,
        name=request.name,
        category_id=request.categoryId,
        barcode=request.barcode or None,
    )
    db.add(item)
    db.commit()
    return AndroidStatusVM(status=1)


@router.put("/item/update", response_model=AndroidMessageVM)
async def android_item_update(
    request: AndroidPostItem,
    id: int = Query(..., description="item id"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: update item by id."""
    item = (
        db.query(Item)
        .filter(
            Item.id == id,
            Item.customer_id == current_user.customerId,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.name = request.name
    item.category_id = request.categoryId
    if request.barcode is not None:
        item.barcode = request.barcode
    db.commit()
    return AndroidMessageVM(message="OK")


# --- Inventory: barcode list (check items) ---

@router.post("/inventory/barcodelist", response_model=List[AndroidResponseCheckItem])
async def android_inventory_barcodelist(
    request: AndroidPostCheckItem,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: get inventory info for a list of barcodes."""
    result = []
    for barcode in request.barcode_list or []:
        inv = (
            db.query(Inventory)
            .filter(
                Inventory.customer_id == current_user.customerId,
                Inventory.barcode == barcode,
            )
            .first()
        )
        if inv:
            result.append(
                AndroidResponseCheckItem(
                    id=inv.id,
                    item_name=inv.item.name if inv.item else None,
                    category_name=inv.category.name if inv.category else None,
                    building_name=inv.building.name if inv.building else None,
                    area_name=inv.area.name if inv.area else None,
                    floor_name=inv.floor.name if inv.floor else None,
                    detail_location_name=(
                        inv.detail_location.name if inv.detail_location else None
                    ),
                    purchase_date=inv.purchase_date,
                    last_date=inv.last_date,
                    ref_client=inv.ref_client,
                    reg_date=inv.reg_date,
                    status=inv.status,
                    comment=inv.comment,
                    barcode=inv.barcode,
                    username=inv.operator.username if inv.operator else None,
                    room_assignment=inv.room_assignment,
                    category_df_immonet=inv.category_df_immonet,
                    purchase_amount=str(inv.purchase_amount) if inv.purchase_amount else None,
                )
            )
        else:
            result.append(
                AndroidResponseCheckItem(barcode=barcode, status=4)
            )  # 4 = missing
    return result


# --- Inventory: detect barcode (single) ---

@router.post("/inventory/detect/barcode", response_model=AndroidResponseCheckTag)
async def android_inventory_detect_barcode(
    request: AndroidPostInventory,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: classify one barcode as right/wrong/missing/unknown."""
    barcode = request.barcode or ""
    inv = (
        db.query(Inventory)
        .filter(
            Inventory.customer_id == current_user.customerId,
            Inventory.barcode == barcode,
        )
        .first()
    )
    if inv:
        return AndroidResponseCheckTag(
            right_list=[barcode],
            wrong_list=[],
            missing_list=[],
            unknown_list=[],
        )
    return AndroidResponseCheckTag(
        right_list=[],
        wrong_list=[],
        missing_list=[barcode],
        unknown_list=[],
    )


# --- Inventory: update location by barcode list ---

@router.post("/inventory/location/barcode", response_model=AndroidFixLocationStatusVM)
async def android_inventory_location_barcode(
    request: AndroidUpdateLocation,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: move inventories (by barcode list) to a location. block_id maps to detail_location_id."""
    updated = 0
    for barcode in request.barcode_list or []:
        inv = (
            db.query(Inventory)
            .filter(
                Inventory.customer_id == current_user.customerId,
                Inventory.barcode == barcode,
            )
            .first()
        )
        if inv:
            inv.building_id = request.building_id if request.building_id else None
            inv.area_id = request.area_id if request.area_id else None
            inv.floor_id = request.floor_id if request.floor_id else None
            inv.detail_location_id = (
                request.block_id if request.block_id else None
            )
            updated += 1
    db.commit()
    return AndroidFixLocationStatusVM(
        status=1,
        message=f"Updated {updated} item(s)",
    )


# --- Missing item ---

@router.post("/missingitem/create", response_model=AndroidMessageVM)
async def android_missingitem_create(
    request: AndroidPostAddMissingItem,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: mark items as missing at a location (by barcode list)."""
    # locationId = detail_location_id or similar; barcode_list = barcodes to mark missing
    for barcode in request.barcode_list or []:
        inv = (
            db.query(Inventory)
            .filter(
                Inventory.customer_id == current_user.customerId,
                Inventory.barcode == barcode,
            )
            .first()
        )
        if inv:
            inv.status = 4  # Missing
            inv.detail_location_id = (
                request.locationId if request.locationId else inv.detail_location_id
            )
    db.commit()
    return AndroidMessageVM(message="OK")


# --- Building: detect QR code (match building by name) ---

@router.post("/building/detect-qrcode", response_model=AndroidQrReturn)
async def android_building_detect_qrcode(
    request: AndroidPostQRCode,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Android: resolve QR name to building (and optionally area/floor/block). Returns ids or -1."""
    building = (
        db.query(Building)
        .filter(
            Building.customer_id == current_user.customerId,
            Building.name == request.name,
        )
        .first()
    )
    if not building:
        return AndroidQrReturn(
            building_id=-1,
            area_id=-1,
            floor_id=-1,
            block_id=-1,
        )
    return AndroidQrReturn(
        building_id=building.id,
        area_id=-1,
        floor_id=-1,
        block_id=-1,
    )
