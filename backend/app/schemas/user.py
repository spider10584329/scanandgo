"""
User/Operator schemas
"""
from pydantic import BaseModel, field_validator
from typing import Optional


class OperatorBase(BaseModel):
    """Base operator schema"""
    username: str
    customer_id: int


class OperatorCreate(OperatorBase):
    """Create operator schema"""
    password: str
    isActive: int = 1
    
    @field_validator('password')
    @classmethod
    def password_length(cls, v):
        if len(v) > 255:
            raise ValueError('Password cannot be longer than 255 characters')
        if len(v) < 1:
            raise ValueError('Password is required')
        return v


class OperatorUpdate(BaseModel):
    """Update operator schema"""
    username: Optional[str] = None
    isActive: Optional[int] = None
    isPasswordRequest: Optional[int] = None
    password: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def password_length(cls, v):
        if v is not None:
            if len(v) > 255:
                raise ValueError('Password cannot be longer than 255 characters')
            if len(v) < 1:
                raise ValueError('Password cannot be empty')
        return v


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
