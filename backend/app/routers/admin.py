from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import secrets

from app.database import get_db
from app.models.apikey import APIKey
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/get-apikey")
async def get_apikey(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apikey = db.query(APIKey).filter(
        APIKey.customer_id == current_user.customerId
    ).first()
    
    if not apikey:
        return {
            "success": True,
            "exists": False,
            "apiKey": None,
            "created_at": None
        }
    
    return {
        "success": True,
        "exists": True,
        "apiKey": apikey.api_key,
        "created_at": apikey.created_at.isoformat() if apikey.created_at else None
    }


@router.post("/generate-apikey")
async def generate_apikey(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_key = db.query(APIKey).filter(
        APIKey.customer_id == current_user.customerId
    ).first()
    
    if existing_key:
        db.delete(existing_key)
        db.commit()
    
    new_key = secrets.token_urlsafe(32)
    
    apikey = APIKey(
        customer_id=current_user.customerId,
        api_key=new_key
    )
    
    db.add(apikey)
    db.commit()
    db.refresh(apikey)
    
    return {
        "success": True,
        "exists": True,
        "apiKey": apikey.api_key,
        "created_at": apikey.created_at.isoformat() if apikey.created_at else None
    }


@router.delete("/delete-apikey")
async def delete_apikey(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apikey = db.query(APIKey).filter(
        APIKey.customer_id == current_user.customerId
    ).first()
    
    if not apikey:
        raise HTTPException(status_code=404, detail="API key not found")
    
    db.delete(apikey)
    db.commit()
    
    return {"success": True, "message": "API key deleted successfully"}
