"""
Authentication and authorization routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.models.operator import Operator
from app.models.agent import Agent
from app.schemas.auth import (
    SignInRequest, TokenResponse, VerifyTokenRequest, VerifyTokenResponse,
    RegisterUserRequest, PasswordResetRequest, PasswordResetRequestOnly,
    CheckUsernameRequest, CheckAdminEmailRequest,
    DeviceSignInRequest, DeviceSignInResponse
)
from app.schemas.common import SuccessResponse
from app.utils.auth import verify_password, get_password_hash, create_access_token, verify_token
from app.utils.dependencies import get_current_user
from app.services.pulsepoint import pulsepoint_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Authentication"])


@router.post("/user/signin", response_model=DeviceSignInResponse)
async def device_signin(request: DeviceSignInRequest, db: Session = Depends(get_db)):
    """
    Device-id-only signin for Android app.
    Looks up Agent by device_id; if not found, creates one with customer_id=1.
    Returns access_token, message, status (1=success) for LoginVM compatibility.
    """
    agent = db.query(Agent).filter(Agent.device_id == request.device_id).first()
    if not agent:
        # Auto-register device with default customer so app works without pre-registration
        agent = Agent(device_id=request.device_id, customer_id=1)
        db.add(agent)
        db.commit()
        db.refresh(agent)
        logger.info(f"New device registered: device_id={request.device_id[:16]}... -> customer_id=1")
    token = create_access_token({
        "customerId": agent.customer_id,
        "userId": agent.agents_id,
        "username": f"device_{agent.agents_id}",
        "role": "agent",
        "isActive": True
    })
    return DeviceSignInResponse(
        access_token=token,
        message="Login successful",
        status=1,
        customer_id=agent.customer_id
    )


@router.post("/signin", response_model=TokenResponse)
async def signin(request: SignInRequest, db: Session = Depends(get_db)):
    """
    Sign in endpoint for both admin and agent users

    - Admin: Authenticates via PulsePoint API
    - Agent: Authenticates via local database
    """
    logger.info(f"Sign in attempt for {request.role}: {request.email}")

    # Handle Admin login (PulsePoint API)
    if request.role == "admin":
        try:
            user = await pulsepoint_service.authenticate_user(request.email, request.password)

            if not user:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid credentials or account not found"
                )

            # Generate JWT token
            token = create_access_token({
                "customerId": user["id"],
                "userId": user["id"],
                "username": user.get("email", request.email),
                "email": user.get("email", request.email),
                "role": "admin",
                "isActive": True
            })

            return TokenResponse(
                success=True,
                message="Login successful",
                token=token,
                user={
                    "customerId": user["id"],
                    "id": user["id"],
                    "username": user.get("email"),
                    "email": user.get("email"),
                    "role": "admin"
                }
            )

        except Exception as e:
            logger.error(f"Admin authentication error: {e}")
            raise HTTPException(
                status_code=503,
                detail="External authentication service unavailable"
            )

    # Handle Agent login (Local database)
    if request.role == "agent":
        # Find operator by username
        operator = db.query(Operator).filter(
            Operator.username == request.email
        ).first()

        if not operator:
            logger.warning(f"Agent login failed - account not found: {request.email}")
            raise HTTPException(
                status_code=401,
                detail="This account is not registered"
            )

        # Check if active
        if not operator.isActive or operator.isActive == 0:
            logger.warning(f"Agent login failed - account inactive: {request.email}")
            raise HTTPException(
                status_code=403,
                detail="Account is not active"
            )

        # Verify password
        logger.info(f"Verifying password for agent: {request.email}, hash prefix: {operator.password[:15] if operator.password else 'None'}")
        if not verify_password(request.password, operator.password):
            logger.warning(f"Agent login failed - incorrect password: {request.email}")
            raise HTTPException(
                status_code=401,
                detail="Incorrect password"
            )

        logger.info(f"Agent login successful: {request.email}")
        
        # Generate JWT token
        token = create_access_token({
            "customerId": operator.customer_id,
            "userId": operator.id,
            "username": operator.username,
            "role": "agent",
            "isActive": operator.isActive == 1
        })

        return TokenResponse(
            success=True,
            message="Login successful",
            token=token,
            user={
                "customerId": operator.customer_id,
                "id": operator.id,
                "username": operator.username,
                "role": "agent"
            }
        )

    raise HTTPException(status_code=400, detail="Invalid role specified")


@router.post("/verify-token", response_model=VerifyTokenResponse)
async def verify_token_endpoint(request: VerifyTokenRequest):
    """Verify JWT token validity"""
    if not request.token:
        return VerifyTokenResponse(
            valid=False,
            error="Token is required"
        )

    payload = verify_token(request.token)

    if not payload:
        return VerifyTokenResponse(
            valid=False,
            error="Invalid token"
        )

    return VerifyTokenResponse(
        valid=True,
        payload=payload
    )


@router.post("/register-user", response_model=SuccessResponse)
async def register_user(
    request: RegisterUserRequest,
    db: Session = Depends(get_db)
):
    """Register new agent/operator (self-registration with valid admin email)"""

    # Check if username already exists
    existing = db.query(Operator).filter(
        Operator.username == request.username
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Username already exists"
        )

    # Hash password
    hashed_password = get_password_hash(request.password)

    # Create new operator
    new_operator = Operator(
        customer_id=request.customer_id,
        username=request.username,
        password=hashed_password,
        isActive=1
    )

    db.add(new_operator)
    db.commit()
    db.refresh(new_operator)

    logger.info(f"New operator registered: {request.username}")

    return SuccessResponse(
        success=True,
        message="User registered successfully"
    )


@router.post("/password-reset-request", response_model=SuccessResponse)
async def password_reset_request(
    request: PasswordResetRequestOnly,
    db: Session = Depends(get_db)
):
    """User requests a password reset - flags account for admin to handle"""

    operator = db.query(Operator).filter(
        Operator.username == request.username
    ).first()

    if not operator:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    operator.isPasswordRequest = 1
    db.commit()

    logger.info(f"Password reset requested for user: {request.username}")

    return SuccessResponse(
        success=True,
        message="Password reset request submitted. Please contact your administrator."
    )


@router.post("/password-reset", response_model=SuccessResponse)
async def password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Reset operator password (admin sets new password)"""

    operator = db.query(Operator).filter(
        Operator.username == request.username
    ).first()

    if not operator:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Hash new password
    operator.password = get_password_hash(request.new_password)
    operator.isPasswordRequest = 0

    db.commit()

    logger.info(f"Password reset for user: {request.username}")

    return SuccessResponse(
        success=True,
        message="Password reset successfully"
    )


@router.post("/check-username", response_model=dict)
async def check_username(
    request: CheckUsernameRequest,
    db: Session = Depends(get_db)
):
    """Check if username is available"""

    exists = db.query(Operator).filter(
        Operator.username == request.username
    ).first() is not None

    return {
        "available": not exists,
        "exists": exists
    }


@router.post("/check-admin-email", response_model=dict)
async def check_admin_email(request: CheckAdminEmailRequest):
    """Check if admin email exists in PulsePoint and return customerId"""

    result = await pulsepoint_service.check_admin_email(request.email)

    return result
