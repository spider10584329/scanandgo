"""
Analytics and reporting routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.database import get_db
from app.models.inventory import Inventory
from app.models.missing_item import MissingItem
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["Analytics"])


@router.get("/search")
async def search(
    q: str = Query(None),
    limit: int = Query(50, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search inventories by barcode or item name"""
    if not q or not q.strip():
        return {"success": True, "results": [], "total": 0, "query": ""}

    query = db.query(Inventory).filter(
        Inventory.customer_id == current_user.customerId
    ).filter(
        Inventory.barcode.contains(q)
    )

    results = query.limit(limit).all()

    return {
        "success": True,
        "results": results,
        "total": len(results),
        "query": q
    }


@router.get("/duplicates")
async def get_duplicates(
    limit: int = Query(100, le=500, description="Max duplicate barcodes to return"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get duplicate inventory records by barcode"""

    # Find barcodes that appear more than once (with limit to prevent memory issues)
    duplicate_barcodes = db.query(Inventory.barcode).filter(
        Inventory.customer_id == current_user.customerId,
        Inventory.barcode != None,
        Inventory.barcode != ""
    ).group_by(Inventory.barcode).having(
        func.count(Inventory.barcode) > 1
    ).limit(limit).all()

    barcode_list = [b[0] for b in duplicate_barcodes]

    if not barcode_list:
        return {"success": True, "duplicates": [], "limited": False}

    # Get all inventories with duplicate barcodes (limited set)
    duplicates = db.query(Inventory).filter(
        Inventory.customer_id == current_user.customerId,
        Inventory.barcode.in_(barcode_list)
    ).order_by(Inventory.barcode, Inventory.id).limit(limit * 10).all()

    # Serialize duplicates with relationships (same format as inventories endpoint)
    serialized_duplicates = [
        {
            "id": inv.id,
            "customer_id": inv.customer_id,
            "item_id": inv.item_id,
            "category_id": inv.category_id,
            "barcode": inv.barcode,
            "status": inv.status,
            "reg_date": inv.reg_date,
            "inv_date": inv.inv_date,
            "comment": inv.comment,
            "rfid": inv.rfid,
            "operator_id": inv.operator_id,
            "room_assignment": inv.room_assignment,
            "is_throw": inv.is_throw,
            "items": {
                "id": inv.item.id,
                "name": inv.item.name,
                "barcode": inv.item.barcode if inv.item.barcode else None
            } if inv.item else None,
            "categories": {
                "id": inv.category.id,
                "name": inv.category.name
            } if inv.category else None,
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
            "operators": {
                "id": inv.operator.id,
                "username": inv.operator.username
            } if inv.operator and inv.operator_id else None,
        }
        for inv in duplicates
    ]

    return {
        "success": True,
        "duplicates": serialized_duplicates,
        "limited": len(duplicate_barcodes) >= limit
    }


@router.get("/missing-items")
async def get_missing_items(
    limit: int = Query(500, le=1000, description="Max items to return"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get missing items"""
    missing = db.query(MissingItem).filter(
        MissingItem.customer_id == current_user.customerId
    ).limit(limit).all()

    return {"success": True, "missing_items": missing, "limited": len(missing) >= limit}


@router.post("/missing-items")
async def create_missing_item(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create missing item record"""
    new_missing = MissingItem(
        customer_id=current_user.customerId,
        detail_location_id=request["detail_location_id"],
        barcode=request.get("barcode")
    )

    db.add(new_missing)
    db.commit()
    db.refresh(new_missing)

    return {"success": True, "message": "Missing item created", "missing_item": new_missing}


@router.get("/missing-items/count")
async def get_missing_items_count(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get missing items count"""
    count = db.query(MissingItem).filter(
        MissingItem.customer_id == current_user.customerId
    ).count()

    return {"success": True, "count": count}


@router.get("/breakage/count")
async def get_breakage_count(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get breakage/thrown items count"""
    count = db.query(Inventory).filter(
        Inventory.customer_id == current_user.customerId,
        Inventory.is_throw == True
    ).count()

    return {"success": True, "count": count}
