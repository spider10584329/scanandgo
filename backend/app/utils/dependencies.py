"""
FastAPI dependencies for authentication and authorization
"""
from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.database import get_db
from app.utils.auth import verify_token, extract_token_from_header
from app.schemas.auth import TokenPayload

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user(
    authorization: Optional[str] = Header(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> TokenPayload:
    """
    Get current authenticated user from JWT token

    Args:
        authorization: Authorization header
        credentials: Bearer token credentials

    Returns:
        TokenPayload

    Raises:
        HTTPException: If token is invalid or missing
    """
    # Extract token from header or credentials
    token = None
    if authorization:
        token = extract_token_from_header(authorization)
    elif credentials:
        token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authorization token required"
        )

    # Verify token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    # Check if user is active
    if not payload.isActive:
        raise HTTPException(
            status_code=403,
            detail="User account is not active"
        )

    return payload


async def get_current_admin(
    current_user: TokenPayload = Depends(get_current_user)
) -> TokenPayload:
    """
    Verify current user is an admin

    Args:
        current_user: Current user payload

    Returns:
        TokenPayload

    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


async def get_current_agent(
    current_user: TokenPayload = Depends(get_current_user)
) -> TokenPayload:
    """
    Verify current user is an agent

    Args:
        current_user: Current user payload

    Returns:
        TokenPayload

    Raises:
        HTTPException: If user is not an agent
    """
    if current_user.role != "agent":
        raise HTTPException(
            status_code=403,
            detail="Agent access required"
        )

    return current_user


def verify_customer_access(
    customer_id: int,
    current_user: TokenPayload
) -> bool:
    """
    Verify user has access to customer data

    Args:
        customer_id: Customer ID to check
        current_user: Current user payload

    Returns:
        True if user has access

    Raises:
        HTTPException: If user doesn't have access
    """
    if current_user.customerId != customer_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied to this customer's data"
        )

    return True
