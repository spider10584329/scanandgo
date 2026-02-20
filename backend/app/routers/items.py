"""
Item and Category routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.item import Item
from app.models.category import Category
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse, CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.common import SuccessResponse
from app.utils.dependencies import get_current_user

router_items = APIRouter(prefix="/api/items", tags=["Items"])
router_categories = APIRouter(prefix="/api/categories", tags=["Categories"])


# ITEMS
@router_items.get("", response_model=dict)
async def get_items(
    category_id: Optional[int] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all items"""
    query = db.query(Item).filter(Item.customer_id == current_user.customerId)

    if category_id:
        query = query.filter(Item.category_id == category_id)

    items = query.order_by(Item.name).all()

    return {
        "success": True, 
        "items": [
            {
                "id": item.id,
                "name": item.name,
                "barcode": item.barcode,
                "category_id": item.category_id,
                "customer_id": item.customer_id,
                "categories": {
                    "id": item.category.id,
                    "name": item.category.name
                } if item.category else None
            }
            for item in items
        ]
    }


@router_items.post("", response_model=dict)
async def create_item(
    request: ItemCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new item"""
    try:
        # Check barcode uniqueness
        existing = db.query(Item).filter(
            Item.customer_id == current_user.customerId,
            Item.barcode == request.barcode
        ).first()

        if existing:
            raise HTTPException(status_code=409, detail="Barcode already exists")

        # Create new item using Pydantic model
        item_data = request.model_dump()
        new_item = Item(
            customer_id=current_user.customerId,
            **item_data
        )

        db.add(new_item)
        db.commit()
        db.refresh(new_item)

        return {
            "success": True, 
            "message": "Item created successfully", 
            "item": {
                "id": new_item.id,
                "name": new_item.name,
                "barcode": new_item.barcode,
                "category_id": new_item.category_id,
                "customer_id": new_item.customer_id,
                "categories": {
                    "id": new_item.category.id,
                    "name": new_item.category.name
                } if new_item.category else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating item: {str(e)}")


@router_items.put("", response_model=dict)
async def update_item(
    request: ItemUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update item"""
    try:
        if not request.id:
            raise HTTPException(status_code=400, detail="Item ID is required")
            
        item = db.query(Item).filter(
            Item.id == request.id,
            Item.customer_id == current_user.customerId
        ).first()

        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        # Check barcode uniqueness (excluding current item)
        if request.barcode:
            existing = db.query(Item).filter(
                Item.customer_id == current_user.customerId,
                Item.barcode == request.barcode,
                Item.id != request.id
            ).first()

            if existing:
                raise HTTPException(status_code=409, detail="Barcode already exists")

        # Update only provided fields
        update_data = request.model_dump(exclude_unset=True, exclude={'id'})
        for field, value in update_data.items():
            setattr(item, field, value)

        db.commit()
        db.refresh(item)

        return {
            "success": True, 
            "message": "Item updated successfully", 
            "item": {
                "id": item.id,
                "name": item.name,
                "barcode": item.barcode,
                "category_id": item.category_id,
                "customer_id": item.customer_id,
                "categories": {
                    "id": item.category.id,
                    "name": item.category.name
                } if item.category else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating item: {str(e)}")


@router_items.delete("", response_model=SuccessResponse)
async def delete_item(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete item"""
    item = db.query(Item).filter(
        Item.id == request["id"],
        Item.customer_id == current_user.customerId
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()

    return SuccessResponse(success=True, message="Item deleted successfully")


@router_items.get("/count")
async def get_items_count(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get items count"""
    count = db.query(Item).filter(Item.customer_id == current_user.customerId).count()
    return {"success": True, "count": count}


# CATEGORIES
@router_categories.get("", response_model=dict)
async def get_categories(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all categories"""
    categories = db.query(Category).filter(
        Category.customer_id == current_user.customerId
    ).order_by(Category.name).all()

    return {
        "success": True, 
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "customer_id": cat.customer_id
            }
            for cat in categories
        ]
    }


@router_categories.post("", response_model=dict)
async def create_category(
    request: CategoryCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create category"""
    try:
        # Check if category name already exists for this customer
        existing = db.query(Category).filter(
            Category.customer_id == current_user.customerId,
            Category.name == request.name
        ).first()

        if existing:
            raise HTTPException(status_code=409, detail="Category name already exists")

        new_category = Category(
            customer_id=current_user.customerId,
            name=request.name
        )

        db.add(new_category)
        db.commit()
        db.refresh(new_category)

        return {
            "success": True, 
            "message": "Category created successfully", 
            "category": {
                "id": new_category.id,
                "name": new_category.name,
                "customer_id": new_category.customer_id
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating category: {str(e)}")


@router_categories.put("", response_model=dict)
async def update_category(
    request: CategoryUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update category"""
    try:
        if not request.id:
            raise HTTPException(status_code=400, detail="Category ID is required")
            
        category = db.query(Category).filter(
            Category.id == request.id,
            Category.customer_id == current_user.customerId
        ).first()

        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        # Update name if provided
        if request.name:
            category.name = request.name
            
        db.commit()
        db.refresh(category)

        return {
            "success": True, 
            "message": "Category updated successfully", 
            "category": {
                "id": category.id,
                "name": category.name,
                "customer_id": category.customer_id
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating category: {str(e)}")


@router_categories.delete("", response_model=SuccessResponse)
async def delete_category(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete category"""
    category = db.query(Category).filter(
        Category.id == request["id"],
        Category.customer_id == current_user.customerId
    ).first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if any items are using this category
    items_count = db.query(Item).filter(
        Item.category_id == category.id,
        Item.customer_id == current_user.customerId
    ).count()

    if items_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete category. {items_count} item(s) are using this category."
        )

    db.delete(category)
    db.commit()

    return SuccessResponse(success=True, message="Category deleted successfully")


@router_categories.get("/count")
async def get_categories_count(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get categories count"""
    count = db.query(Category).filter(Category.customer_id == current_user.customerId).count()
    return {"success": True, "count": count}
