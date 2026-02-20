"""
User/Operator management routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.operator import Operator
from app.schemas.user import OperatorResponse, OperatorUpdate
from app.schemas.common import SuccessResponse
from app.utils.auth import get_password_hash
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=dict)
async def get_users(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    operators = db.query(Operator).filter(
        Operator.customer_id == current_user.customerId
    ).order_by(Operator.username).all()

    return {
        "success": True, 
        "users": [
            {
                "id": op.id,
                "username": op.username,
                "customer_id": op.customer_id,
                "isActive": op.isActive,
                "isPasswordRequest": op.isPasswordRequest
            } 
            for op in operators
        ]
    }


@router.get("/{user_id}", response_model=dict)
async def get_user(
    user_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    operator = db.query(Operator).filter(
        Operator.id == user_id,
        Operator.customer_id == current_user.customerId
    ).first()

    if not operator:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "success": True, 
        "user": {
            "id": operator.id,
            "username": operator.username,
            "customer_id": operator.customer_id,
            "isActive": operator.isActive,
            "isPasswordRequest": operator.isPasswordRequest
        }
    }


@router.patch("/{user_id}", response_model=SuccessResponse)
async def update_user(
    user_id: int,
    request: OperatorUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user - including password reset if provided"""
    operator = db.query(Operator).filter(
        Operator.id == user_id,
        Operator.customer_id == current_user.customerId
    ).first()

    if not operator:
        raise HTTPException(status_code=404, detail="User not found")

    # Update username if provided
    if request.username is not None:
        operator.username = request.username
    
    # Update account status if provided
    if request.isActive is not None:
        operator.isActive = request.isActive
    
    # Update password request status if provided
    if request.isPasswordRequest is not None:
        operator.isPasswordRequest = request.isPasswordRequest
    
    # Reset password if provided (hash it before saving)
    if request.password is not None and request.password:
        operator.password = get_password_hash(request.password)
        operator.isPasswordRequest = 0  # Clear password request when password is reset

    db.commit()
    db.refresh(operator)

    return SuccessResponse(
        success=True, 
        message="User updated successfully",
        user={
            "id": operator.id,
            "username": operator.username,
            "customer_id": operator.customer_id,
            "isActive": operator.isActive,
            "isPasswordRequest": operator.isPasswordRequest
        }
    )


@router.delete("/{user_id}", response_model=SuccessResponse)
async def delete_user(
    user_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user"""
    operator = db.query(Operator).filter(
        Operator.id == user_id,
        Operator.customer_id == current_user.customerId
    ).first()

    if not operator:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(operator)
    db.commit()

    return SuccessResponse(success=True, message="User deleted successfully")


@router.post("/{user_id}/reset-password", response_model=SuccessResponse)
async def reset_user_password(
    user_id: int,
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset user password"""
    operator = db.query(Operator).filter(
        Operator.id == user_id,
        Operator.customer_id == current_user.customerId
    ).first()

    if not operator:
        raise HTTPException(status_code=404, detail="User not found")

    operator.password = get_password_hash(request["new_password"])
    operator.isPasswordRequest = 0

    db.commit()

    return SuccessResponse(success=True, message="Password reset successfully")


@router.get("/count")
async def get_users_count(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(Operator).filter(Operator.customer_id == current_user.customerId).count()
    return {"success": True, "count": count}
