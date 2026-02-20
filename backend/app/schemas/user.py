"""
User/Operator schemas
"""
from pydantic import BaseModel
from typing import Optional


class OperatorBase(BaseModel):
    """Base operator schema"""
    username: str
    customer_id: int


class OperatorCreate(OperatorBase):
    """Create operator schema"""
    password: str
    isActive: int = 1


class OperatorUpdate(BaseModel):
    """Update operator schema"""
    username: Optional[str] = None
    isActive: Optional[int] = None


class OperatorResponse(OperatorBase):
    """Operator response schema"""
    id: int
    isActive: int
    isPasswordRequest: Optional[int] = None

    class Config:
        from_attributes = True


class OperatorPasswordReset(BaseModel):
    """Operator password reset"""
    new_password: str
