"""
Snapshot management routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import date
import logging

from app.database import get_db
from app.models.snapshot import Snapshot
from app.schemas.common import SuccessResponse
from app.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/snapshots", tags=["Snapshots"])


@router.get("")
async def get_snapshots(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all snapshots with pagination and search"""
    
    # Build query
    query = db.query(Snapshot).filter(
        Snapshot.customer_id == current_user.customerId
    )
    
    # Apply search filter if provided
    if search:
        query = query.filter(
            (Snapshot.name.contains(search)) | (Snapshot.date.contains(search))
        )
    
    # Get total count
    total = query.count()
    
    # Pagination
    skip = (page - 1) * pageSize
    snapshots = query.order_by(desc(Snapshot.id)).offset(skip).limit(pageSize).all()
    
    return {
        "success": True,
        "snapshots": [
            {
                "id": snap.id,
                "customer_id": snap.customer_id,
                "name": snap.name,
                "date": snap.date
            }
            for snap in snapshots
        ],
        "pagination": {
            "page": page,
            "pageSize": pageSize,
            "total": total,
            "totalPages": (total + pageSize - 1) // pageSize
        }
    }


@router.get("/{snapshot_id}")
async def get_snapshot(
    snapshot_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific snapshot by ID"""
    
    snapshot = db.query(Snapshot).filter(
        Snapshot.id == snapshot_id,
        Snapshot.customer_id == current_user.customerId
    ).first()
    
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    return {
        "success": True,
        "snapshot": {
            "id": snapshot.id,
            "customer_id": snapshot.customer_id,
            "name": snapshot.name,
            "date": snapshot.date
        }
    }


@router.post("")
async def create_snapshot(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new snapshot"""
    
    try:
        name = request.get("name", "")
        snapshot_date = request.get("date", str(date.today()))
        
        # Create new snapshot
        new_snapshot = Snapshot(
            customer_id=current_user.customerId,
            name=name,
            date=snapshot_date
        )
        
        db.add(new_snapshot)
        db.commit()
        db.refresh(new_snapshot)
        
        logger.info(f"Created snapshot {new_snapshot.id} for customer {current_user.customerId}")
        
        return {
            "success": True,
            "message": "Snapshot created successfully",
            "snapshot": {
                "id": new_snapshot.id,
                "customer_id": new_snapshot.customer_id,
                "name": new_snapshot.name,
                "date": new_snapshot.date
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating snapshot: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error creating snapshot: {str(e)}")


@router.put("/{snapshot_id}")
async def update_snapshot(
    snapshot_id: int,
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing snapshot"""
    
    snapshot = db.query(Snapshot).filter(
        Snapshot.id == snapshot_id,
        Snapshot.customer_id == current_user.customerId
    ).first()
    
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    # Update fields
    if "name" in request:
        snapshot.name = request["name"]
    if "date" in request:
        snapshot.date = request["date"]
    
    db.commit()
    db.refresh(snapshot)
    
    return {
        "success": True,
        "message": "Snapshot updated successfully",
        "snapshot": {
            "id": snapshot.id,
            "customer_id": snapshot.customer_id,
            "name": snapshot.name,
            "date": snapshot.date
        }
    }


@router.delete("/{snapshot_id}")
async def delete_snapshot(
    snapshot_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a snapshot"""
    
    snapshot = db.query(Snapshot).filter(
        Snapshot.id == snapshot_id,
        Snapshot.customer_id == current_user.customerId
    ).first()
    
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    db.delete(snapshot)
    db.commit()
    
    return {
        "success": True,
        "message": "Snapshot deleted successfully"
    }


@router.get("/count/total")
async def get_snapshots_count(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get total count of snapshots"""
    
    count = db.query(Snapshot).filter(
        Snapshot.customer_id == current_user.customerId
    ).count()
    
    return {
        "success": True,
        "count": count
    }
