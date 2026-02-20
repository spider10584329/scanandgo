"""
Authentication schemas
"""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Literal


class SignInRequest(BaseModel):
    """Sign in request"""
    email: str
    password: str
    role: Literal["admin", "agent"]


class TokenResponse(BaseModel):
    """JWT token response"""
    success: bool = True
    message: str
    token: str
    user: dict


class TokenPayload(BaseModel):
    """JWT token payload"""
    customerId: int
    userId: int
    username: str
    email: Optional[str] = None
    role: Literal["admin", "agent"]
    isActive: bool
    iat: Optional[int] = None
    exp: Optional[int] = None


class VerifyTokenRequest(BaseModel):
    """Token verification request"""
    token: str


class VerifyTokenResponse(BaseModel):
    """Token verification response"""
    valid: bool
    payload: Optional[TokenPayload] = None
    error: Optional[str] = None


class RegisterUserRequest(BaseModel):
    """User registration request"""
    username: str
    password: str
    customer_id: int

    @field_validator('username')
    @classmethod
    def username_valid(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        return v

    @field_validator('password')
    @classmethod
    def password_valid(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v


class PasswordResetRequest(BaseModel):
    """Password reset request (admin sets new password)"""
    username: str
    new_password: str


class PasswordResetRequestOnly(BaseModel):
    """User requests a password reset (no new password - admin will handle)"""
    username: str


class CheckUsernameRequest(BaseModel):
    """Check username availability"""
    username: str


class CheckAdminEmailRequest(BaseModel):
    """Check admin email"""
    email: EmailStr


class DeviceSignInRequest(BaseModel):
    """Device-id-only signin (Android app)"""
    device_id: str


class DeviceSignInResponse(BaseModel):
    """LoginVM-shaped response for Android app"""
    access_token: str
    message: str
    status: int  # 1 = success
