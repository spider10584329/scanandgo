"""
Location management routes (Buildings, Areas, Floors, DetailLocations)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.building import Building
from app.models.area import Area
from app.models.floor import Floor
from app.models.detail_location import DetailLocation
from app.schemas.common import SuccessResponse
from app.schemas.location import (
    BuildingCreate, BuildingUpdate,
    AreaCreate, AreaUpdate,
    FloorCreate, FloorUpdate,
    DetailLocationCreate, DetailLocationUpdate
)
from app.utils.dependencies import get_current_user

# Create routers for each location type
router_buildings = APIRouter(prefix="/api/buildings", tags=["Buildings"])
router_areas = APIRouter(prefix="/api/areas", tags=["Areas"])
router_floors = APIRouter(prefix="/api/floors", tags=["Floors"])
router_detail_locations = APIRouter(prefix="/api/detail-locations", tags=["Detail Locations"])


# BUILDINGS
@router_buildings.get("", response_model=dict)
async def get_buildings(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all buildings"""
    buildings = db.query(Building).filter(
        Building.customer_id == current_user.customerId
    ).order_by(Building.name).all()

    return {
        "success": True, 
        "buildings": [
            {
                "id": b.id,
                "name": b.name,
                "customer_id": b.customer_id
            }
            for b in buildings
        ]
    }


@router_buildings.post("", response_model=dict)
async def create_building(
    request: BuildingCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create building"""
    try:
        new_building = Building(
            customer_id=current_user.customerId,
            name=request.name
        )

        db.add(new_building)
        db.commit()
        db.refresh(new_building)

        return {
            "success": True, 
            "message": "Building created successfully", 
            "building": {
                "id": new_building.id,
                "name": new_building.name,
                "customer_id": new_building.customer_id
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating building: {str(e)}")


@router_buildings.put("", response_model=dict)
async def update_building(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update building"""
    building = db.query(Building).filter(
        Building.id == request["id"],
        Building.customer_id == current_user.customerId
    ).first()

    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    building.name = request["name"]
    db.commit()
    db.refresh(building)

    return {
        "success": True, 
        "message": "Building updated successfully", 
        "building": {
            "id": building.id,
            "name": building.name,
            "customer_id": building.customer_id
        }
    }


@router_buildings.delete("", response_model=SuccessResponse)
async def delete_building(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete building"""
    building = db.query(Building).filter(
        Building.id == request["id"],
        Building.customer_id == current_user.customerId
    ).first()

    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    db.delete(building)
    db.commit()

    return SuccessResponse(success=True, message="Building deleted successfully")


# AREAS
@router_areas.get("", response_model=dict)
async def get_areas(
    building_id: Optional[int] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all areas"""
    query = db.query(Area).filter(Area.customer_id == current_user.customerId)

    if building_id:
        query = query.filter(Area.building_id == building_id)

    areas = query.order_by(Area.name).all()

    return {
        "success": True, 
        "areas": [
            {
                "id": a.id,
                "name": a.name,
                "building_id": a.building_id,
                "customer_id": a.customer_id
            }
            for a in areas
        ]
    }


@router_areas.post("", response_model=dict)
async def create_area(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create area"""
    new_area = Area(
        customer_id=current_user.customerId,
        building_id=request.get("building_id"),
        name=request["name"]
    )

    db.add(new_area)
    db.commit()
    db.refresh(new_area)

    return {
        "success": True, 
        "message": "Area created successfully", 
        "area": {
            "id": new_area.id,
            "name": new_area.name,
            "building_id": new_area.building_id,
            "customer_id": new_area.customer_id
        }
    }


@router_areas.put("", response_model=dict)
async def update_area(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update area"""
    area = db.query(Area).filter(
        Area.id == request["id"],
        Area.customer_id == current_user.customerId
    ).first()

    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    area.name = request["name"]
    if "building_id" in request:
        area.building_id = request["building_id"]
    db.commit()
    db.refresh(area)

    return {
        "success": True, 
        "message": "Area updated successfully", 
        "area": {
            "id": area.id,
            "name": area.name,
            "building_id": area.building_id,
            "customer_id": area.customer_id
        }
    }


@router_areas.delete("", response_model=SuccessResponse)
async def delete_area(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete area"""
    area = db.query(Area).filter(
        Area.id == request["id"],
        Area.customer_id == current_user.customerId
    ).first()

    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    db.delete(area)
    db.commit()

    return SuccessResponse(success=True, message="Area deleted successfully")


# FLOORS
@router_floors.get("", response_model=dict)
async def get_floors(
    area_id: Optional[int] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all floors"""
    query = db.query(Floor).filter(Floor.customer_id == current_user.customerId)

    if area_id:
        query = query.filter(Floor.area_id == area_id)

    floors = query.order_by(Floor.name).all()

    return {
        "success": True, 
        "floors": [
            {
                "id": f.id,
                "name": f.name,
                "area_id": f.area_id,
                "customer_id": f.customer_id
            }
            for f in floors
        ]
    }


@router_floors.post("", response_model=dict)
async def create_floor(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create floor"""
    new_floor = Floor(
        customer_id=current_user.customerId,
        area_id=request.get("area_id"),
        name=request["name"]
    )

    db.add(new_floor)
    db.commit()
    db.refresh(new_floor)

    return {
        "success": True, 
        "message": "Floor created successfully", 
        "floor": {
            "id": new_floor.id,
            "name": new_floor.name,
            "area_id": new_floor.area_id,
            "customer_id": new_floor.customer_id
        }
    }


@router_floors.put("", response_model=dict)
async def update_floor(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update floor"""
    floor = db.query(Floor).filter(
        Floor.id == request["id"],
        Floor.customer_id == current_user.customerId
    ).first()

    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")

    floor.name = request["name"]
    if "area_id" in request:
        floor.area_id = request["area_id"]
    db.commit()
    db.refresh(floor)

    return {
        "success": True, 
        "message": "Floor updated successfully", 
        "floor": {
            "id": floor.id,
            "name": floor.name,
            "area_id": floor.area_id,
            "customer_id": floor.customer_id
        }
    }


@router_floors.delete("", response_model=SuccessResponse)
async def delete_floor(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete floor"""
    floor = db.query(Floor).filter(
        Floor.id == request["id"],
        Floor.customer_id == current_user.customerId
    ).first()

    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")

    db.delete(floor)
    db.commit()

    return SuccessResponse(success=True, message="Floor deleted successfully")


# DETAIL LOCATIONS
@router_detail_locations.get("", response_model=dict)
async def get_detail_locations(
    floor_id: Optional[int] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all detail locations"""
    query = db.query(DetailLocation).filter(DetailLocation.customer_id == current_user.customerId)

    if floor_id:
        query = query.filter(DetailLocation.floor_id == floor_id)

    detail_locations = query.order_by(DetailLocation.name).all()

    return {
        "success": True, 
        "detailLocations": [
            {
                "id": dl.id,
                "name": dl.name,
                "floor_id": dl.floor_id if dl.floor_id is not None else None,
                "customer_id": dl.customer_id,
                "img_data": dl.img_data if dl.img_data else None
            }
            for dl in detail_locations
        ]
    }


@router_detail_locations.post("", response_model=dict)
async def create_detail_location(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create detail location"""
    new_location = DetailLocation(
        customer_id=current_user.customerId,
        floor_id=request.get("floor_id"),
        name=request["name"]
    )

    db.add(new_location)
    db.commit()
    db.refresh(new_location)

    return {
        "success": True, 
        "message": "Detail location created successfully", 
        "detail_location": {
            "id": new_location.id,
            "name": new_location.name,
            "floor_id": new_location.floor_id if new_location.floor_id is not None else None,
            "customer_id": new_location.customer_id,
            "img_data": new_location.img_data if new_location.img_data else None
        }
    }


@router_detail_locations.put("", response_model=dict)
async def update_detail_location(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update detail location"""
    location = db.query(DetailLocation).filter(
        DetailLocation.id == request["id"],
        DetailLocation.customer_id == current_user.customerId
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Detail location not found")

    location.name = request["name"]
    if "floor_id" in request:
        location.floor_id = request["floor_id"]
    db.commit()
    db.refresh(location)

    return {
        "success": True, 
        "message": "Detail location updated successfully", 
        "detail_location": {
            "id": location.id,
            "name": location.name,
            "floor_id": location.floor_id if location.floor_id is not None else None,
            "customer_id": location.customer_id,
            "img_data": location.img_data if location.img_data else None
        }
    }


@router_detail_locations.delete("", response_model=SuccessResponse)
async def delete_detail_location(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete detail location"""
    location = db.query(DetailLocation).filter(
        DetailLocation.id == request["id"],
        DetailLocation.customer_id == current_user.customerId
    ).first()

    if not location:
        raise HTTPException(status_code=404, detail="Detail location not found")

    db.delete(location)
    db.commit()

    return SuccessResponse(success=True, message="Detail location deleted successfully")


@router_detail_locations.get("/count")
async def get_locations_count(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get locations count"""
    count = db.query(DetailLocation).filter(DetailLocation.customer_id == current_user.customerId).count()
    return {"success": True, "count": count}
