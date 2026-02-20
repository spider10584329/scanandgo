"""
External API routes for third-party access using API keys
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.inventory import Inventory
from app.models.apikey import APIKey

router = APIRouter(prefix="/api/scanandgo", tags=["External API"])


@router.get("/inventory")
async def get_inventory_external(
    customer_id: int = Query(..., description="Customer ID"),
    apikey: str = Query(..., description="API Key for authentication"),
    db: Session = Depends(get_db)
):
    """
    External API endpoint to get inventory data using API key authentication.
    Returns inventory data with resolved names for all relationships.
    """

    # Validate API key
    stored_key = db.query(APIKey).filter(
        APIKey.customer_id == customer_id,
        APIKey.api_key == apikey
    ).first()

    if not stored_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key or customer ID"
        )

    # Fetch all inventory for this customer
    inventories = db.query(Inventory).filter(
        Inventory.customer_id == customer_id
    ).all()

    # Serialize with resolved names (flat structure for CSV compatibility)
    result = [
        {
            "id": inv.id,
            "customer_id": inv.customer_id,
            "category_name": inv.category.name if inv.category else None,
            "item_name": inv.item.name if inv.item else None,
            "item_barcode": inv.item.barcode if inv.item and inv.item.barcode else None,
            "building_name": inv.building.name if inv.building else None,
            "area_name": inv.area.name if inv.area else None,
            "floor_name": inv.floor.name if inv.floor else None,
            "detail_location_name": inv.detail_location.name if inv.detail_location else None,
            "barcode": inv.barcode,
            "status": inv.status,
            "status_name": {
                0: "Inactive",
                1: "Active",
                2: "Maintenance",
                3: "Retired",
                4: "Missing"
            }.get(inv.status, "Unknown") if inv.status is not None else None,
            "purchase_date": inv.purchase_date,
            "last_date": inv.last_date,
            "ref_client": inv.ref_client,
            "reg_date": inv.reg_date,
            "inv_date": inv.inv_date,
            "comment": inv.comment,
            "rfid": inv.rfid,
            "room_assignment": inv.room_assignment,
            "category_df_immonet": inv.category_df_immonet,
            "purchase_amount": inv.purchase_amount,
            "is_throw": inv.is_throw,
            "operator_name": inv.operator.username if inv.operator else None
        }
        for inv in inventories
    ]

    return result
