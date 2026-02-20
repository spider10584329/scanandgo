"""
Inventory management routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from typing import Optional, List, Dict, Any
from datetime import date
import logging

from app.database import get_db
from app.models.inventory import Inventory
from app.models.item import Item
from app.models.category import Category
from app.models.building import Building
from app.models.area import Area
from app.models.floor import Floor
from app.models.detail_location import DetailLocation
from app.models.operator import Operator
from app.schemas.inventory import (
    InventoryResponse, InventoryCreate, InventoryUpdate,
    InventoryStatusSummary, InventoryMoveRequest
)
from app.schemas.common import SuccessResponse
from app.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/inventories", tags=["Inventories"])


@router.get("", response_model=dict)
async def get_inventories(
    building_id: Optional[int] = Query(None),
    area_id: Optional[int] = Query(None),
    floor_id: Optional[int] = Query(None),
    detail_location_id: Optional[int] = Query(None),
    barcode_search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get inventories with filtering and pagination"""

    # Build query
    query = db.query(Inventory).filter(
        Inventory.customer_id == current_user.customerId
    )

    # Apply filters
    if building_id:
        query = query.filter(Inventory.building_id == building_id)
    if area_id:
        query = query.filter(Inventory.area_id == area_id)
    if floor_id:
        query = query.filter(Inventory.floor_id == floor_id)
    if detail_location_id:
        query = query.filter(Inventory.detail_location_id == detail_location_id)
    if barcode_search:
        query = query.filter(Inventory.barcode.contains(barcode_search))

    # Get total count
    total = query.count()

    # Pagination
    skip = (page - 1) * pageSize
    inventories = query.order_by(desc(Inventory.id)).offset(skip).limit(pageSize).all()

    return {
        "success": True,
        "inventories": [
            {
                "id": inv.id,
                "customer_id": inv.customer_id,
                "item_id": inv.item_id,
                "category_id": inv.category_id,
                "categories": {
                    "id": inv.category.id,
                    "name": inv.category.name
                } if inv.category else None,
                "items": {
                    "id": inv.item.id,
                    "name": inv.item.name,
                    "barcode": inv.item.barcode if inv.item.barcode else None
                } if inv.item else None,
                "buildings": {
                    "id": inv.building.id,
                    "name": inv.building.name
                } if inv.building and inv.building_id else None,
                "areas": {
                    "id": inv.area.id,
                    "name": inv.area.name
                } if inv.area and inv.area_id else None,
                "floors": {
                    "id": inv.floor.id,
                    "name": inv.floor.name
                } if inv.floor and inv.floor_id else None,
                "detail_locations": {
                    "id": inv.detail_location.id,
                    "name": inv.detail_location.name
                } if inv.detail_location and inv.detail_location_id else None,
                "building_id": inv.building_id,
                "area_id": inv.area_id,
                "floor_id": inv.floor_id,
                "detail_location_id": inv.detail_location_id,
                "barcode": inv.barcode,
                "status": inv.status,
                "reg_date": inv.reg_date,
                "inv_date": inv.inv_date,
                "comment": inv.comment,
                "rfid": inv.rfid,
                "operator_id": inv.operator_id,
                "purchase_date": inv.purchase_date,
                "last_date": inv.last_date,
                "ref_client": inv.ref_client,
                "room_assignment": inv.room_assignment,
                "category_df_immonet": inv.category_df_immonet,
                "purchase_amount": inv.purchase_amount,
                "is_throw": inv.is_throw,
            }
            for inv in inventories
        ],
        "pagination": {
            "page": page,
            "pageSize": pageSize,
            "total": total,
            "totalPages": (total + pageSize - 1) // pageSize
        }
    }


@router.post("", response_model=SuccessResponse)
async def create_inventories(
    request: dict,  # Using dict to match Next.js structure
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create inventory records"""

    items = request.get("items", [])
    location_data = request.get("locationData", {})

    if not items:
        raise HTTPException(status_code=400, detail="Items are required")

    current_date = str(date.today())

    # Get item barcodes
    item_ids = [item["id"] for item in items]
    items_with_barcodes = db.query(Item).filter(
        Item.id.in_(item_ids),
        Item.customer_id == current_user.customerId
    ).all()

    barcode_map = {item.id: item.barcode for item in items_with_barcodes}

    # Create inventory records
    inventory_records = []
    for item in items:
        inventory = Inventory(
            customer_id=current_user.customerId,
            item_id=item["id"],
            category_id=item.get("category_id"),
            building_id=location_data.get("buildingId"),
            area_id=location_data.get("areaId"),
            floor_id=location_data.get("floorId"),
            detail_location_id=location_data.get("detailLocationId"),
            barcode=barcode_map.get(item["id"]),
            reg_date=current_date,
            inv_date=current_date,
            status=1
        )
        inventory_records.append(inventory)

    db.add_all(inventory_records)
    db.commit()

    logger.info(f"Created {len(inventory_records)} inventory records")

    return SuccessResponse(
        success=True,
        message=f"Successfully created {len(inventory_records)} inventory records"
    )


# IMPORTANT: /move must be defined BEFORE /{inventory_id} to avoid route matching issues
@router.patch("/move")
async def move_inventories(
    request: Request,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Move multiple inventories to new location"""

    try:
        # Parse JSON body manually
        body = await request.json()

        logger.info(f"Move request received: {body}")
        logger.info(f"User customer_id: {current_user.customerId}")

        inventory_ids = body.get("inventoryIds", [])
        location_data = body.get("locationData", {})

        logger.info(f"Inventory IDs: {inventory_ids}")
        logger.info(f"Location data: {location_data}")

        if not inventory_ids:
            logger.warning("No inventory IDs provided in request")
            raise HTTPException(status_code=400, detail="No inventory IDs provided")

        if not isinstance(inventory_ids, list):
            logger.error(f"inventoryIds is not a list: {type(inventory_ids)}")
            raise HTTPException(status_code=400, detail="inventoryIds must be a list")

        inventories = db.query(Inventory).filter(
            Inventory.id.in_(inventory_ids),
            Inventory.customer_id == current_user.customerId
        ).all()

        logger.info(f"Found {len(inventories)} inventories to move (requested {len(inventory_ids)})")

        if not inventories:
            logger.warning(f"No inventories found for IDs {inventory_ids} and customer {current_user.customerId}")
            raise HTTPException(status_code=404, detail="No inventories found with the provided IDs")

        # Update location for all
        for inv in inventories:
            old_location = f"Building:{inv.building_id}, Area:{inv.area_id}, Floor:{inv.floor_id}, Detail:{inv.detail_location_id}"

            inv.building_id = location_data.get("buildingId")
            inv.area_id = location_data.get("areaId")
            inv.floor_id = location_data.get("floorId")
            inv.detail_location_id = location_data.get("detailLocationId")

            new_location = f"Building:{inv.building_id}, Area:{inv.area_id}, Floor:{inv.floor_id}, Detail:{inv.detail_location_id}"
            logger.info(f"Inventory {inv.id}: {old_location} -> {new_location}")

        db.commit()

        logger.info(f"Successfully moved {len(inventories)} inventory items")

        return {
            "success": True,
            "message": f"Successfully moved {len(inventories)} inventory items",
            "updatedCount": len(inventories)
        }
    except HTTPException as http_ex:
        logger.error(f"HTTP Exception in move_inventories: {http_ex.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error moving inventories: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error moving inventories: {str(e)}")


@router.patch("/{inventory_id}", response_model=SuccessResponse)
async def update_inventory(
    inventory_id: int,
    request: InventoryUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update inventory record"""

    inventory = db.query(Inventory).filter(
        Inventory.id == inventory_id,
        Inventory.customer_id == current_user.customerId
    ).first()

    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")

    # Update fields
    for field, value in request.dict(exclude_unset=True).items():
        setattr(inventory, field, value)

    db.commit()

    return SuccessResponse(success=True, message="Inventory updated successfully")


@router.delete("/{inventory_id}", response_model=SuccessResponse)
async def delete_inventory(
    inventory_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete inventory record"""

    inventory = db.query(Inventory).filter(
        Inventory.id == inventory_id,
        Inventory.customer_id == current_user.customerId
    ).first()

    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")

    db.delete(inventory)
    db.commit()

    return SuccessResponse(success=True, message="Inventory deleted successfully")


@router.get("/status-summary")
async def get_status_summary(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get inventory status summary"""

    # Single query with conditional aggregation (optimized from 5 queries to 1)
    result = db.query(
        func.count(Inventory.id).label("total"),
        func.sum(case((Inventory.status == 0, 1), else_=0)).label("inactive"),
        func.sum(case((Inventory.status == 1, 1), else_=0)).label("active"),
        func.sum(case((Inventory.status == 2, 1), else_=0)).label("maintenance"),
        func.sum(case((Inventory.status == 3, 1), else_=0)).label("retired"),
        func.sum(case((Inventory.status == 4, 1), else_=0)).label("missing")
    ).filter(
        Inventory.customer_id == current_user.customerId
    ).first()

    return {
        "success": True,
        "statusCounts": {
            0: result.inactive or 0,
            1: result.active or 0,
            2: result.maintenance or 0,
            3: result.retired or 0,
            4: result.missing or 0
        },
        "total": result.total or 0
    }


@router.get("/count")
async def get_inventory_count(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get total inventory count"""

    count = db.query(Inventory).filter(
        Inventory.customer_id == current_user.customerId
    ).count()

    return {"count": count, "success": True}


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = Query(10, le=50),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent inventory activity"""

    recent = db.query(Inventory).filter(
        Inventory.customer_id == current_user.customerId
    ).order_by(desc(Inventory.id)).limit(limit).all()

    return {
        "success": True,
        "activities": [
            {
                "id": inv.id,
                "customer_id": inv.customer_id,
                "item_id": inv.item_id,
                "category_id": inv.category_id,
                "barcode": inv.barcode,
                "status": inv.status,
                "reg_date": inv.reg_date,
                "inv_date": inv.inv_date,
            }
            for inv in recent
        ]
    }


@router.get("/location-analytics")
async def get_location_analytics(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get location-based analytics"""
    from sqlalchemy import func

    # Get detailed location analytics with full hierarchy
    location_stats = db.query(
        Building.name.label("building_name"),
        Area.name.label("area_name"),
        Floor.name.label("floor_name"),
        DetailLocation.name.label("detail_location_name"),
        func.count(Inventory.id).label("total_items"),
        func.sum(case((Inventory.status == 4, 1), else_=0)).label("missing_items")
    ).select_from(
        Inventory
    ).outerjoin(
        Building, Inventory.building_id == Building.id
    ).outerjoin(
        Area, Inventory.area_id == Area.id
    ).outerjoin(
        Floor, Inventory.floor_id == Floor.id
    ).outerjoin(
        DetailLocation, Inventory.detail_location_id == DetailLocation.id
    ).filter(
        Inventory.customer_id == current_user.customerId
    ).group_by(
        Building.name, Area.name, Floor.name, DetailLocation.name
    ).all()

    # Calculate total for percentage
    total_items = sum(stat.total_items for stat in location_stats)

    locations = [
        {
            "locationName": f"{stat.building_name or ''}/{stat.area_name or ''}/{stat.floor_name or ''}/{stat.detail_location_name or ''}".strip('/'),
            "buildingName": stat.building_name or "",
            "areaName": stat.area_name or "",
            "floorName": stat.floor_name or "",
            "detailLocationName": stat.detail_location_name or "",
            "totalItems": stat.total_items,
            "missingItems": stat.missing_items or 0,
            "percentage": round((stat.total_items / total_items * 100) if total_items > 0 else 0, 2)
        }
        for stat in location_stats if stat.total_items > 0
    ]

    return {
        "success": True,
        "locations": locations
    }

    return {
        "success": True,
        "locations": locations
    }
