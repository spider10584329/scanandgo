"""
Authentication utilities - JWT token generation and verification
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import logging

from app.config import settings
from app.schemas.auth import TokenPayload

logger = logging.getLogger(__name__)

# Password hashing
# Support multiple schemes for backward compatibility:
# - bcrypt: preferred (new passwords)
# - pbkdf2_sha256: legacy (old passwords from previous system)
pwd_context = CryptContext(
    schemes=["bcrypt", "pbkdf2_sha256"],
    deprecated=["pbkdf2_sha256"]  # Mark pbkdf2_sha256 as deprecated but still verify
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.

    Supports both bcrypt and pbkdf2_sha256 for backward compatibility.
    Truncates passwords to 72 bytes for bcrypt compatibility.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database

    Returns:
        True if password matches, False otherwise
    """
    try:
        # Truncate to 72 bytes for bcrypt compatibility
        safe_password = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
        return pwd_context.verify(safe_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    Truncates passwords to 72 bytes for bcrypt compatibility.

    Args:
        password: Plain text password

    Returns:
        bcrypt hashed password
    """
    # Truncate to 72 bytes for bcrypt compatibility
    safe_password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(safe_password)


def create_access_token(data: dict) -> str:
    """
    Create JWT access token

    Args:
        data: Token payload data

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()

    # Add expiration time
    expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()
    })

    # Encode token
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt


def verify_token(token: str) -> Optional[TokenPayload]:
    """
    Verify and decode JWT token

    Args:
        token: JWT token string

    Returns:
        TokenPayload if valid, None otherwise
    """
    try:
        # Decode token
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )

        # Validate payload
        return TokenPayload(**payload)

    except JWTError as e:
        logger.error(f"Token verification failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {e}")
        return None


def extract_token_from_header(authorization: Optional[str]) -> Optional[str]:
    """
    Extract token from Authorization header

    Args:
        authorization: Authorization header value

    Returns:
        Token string or None
    """
    if not authorization:
        return None

    if not authorization.startswith("Bearer "):
        return None

    return authorization.split(" ")[1]
