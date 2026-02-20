"""
PulsePoint API integration service
"""
import httpx
import logging
from typing import Optional, Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)


class PulsePointService:
    """Service for interacting with PulsePoint API (Singleton pattern)"""

    _instance: Optional['PulsePointService'] = None
    _client: Optional[httpx.AsyncClient] = None

    def __new__(cls) -> 'PulsePointService':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.api_url = settings.PULSEPOINT_API_URL
        self.project_id = settings.PULSEPOINT_PROJECT_ID
        self.api_username = settings.PULSEPOINT_API_USERNAME
        self.api_password = settings.PULSEPOINT_API_PASSWORD
        self._initialized = True

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client with connection pooling"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=10.0,
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
            )
        return self._client

    async def close(self):
        """Close the HTTP client"""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate admin user with PulsePoint API

        Args:
            username: User's email/username
            password: User's password

        Returns:
            User data if authentication successful, None otherwise
        """
        try:
            client = await self._get_client()
            # Authenticate with PulsePoint
            auth_response = await client.post(
                f"{self.api_url}/api/user/project/signin",
                json={
                    "username": username,
                    "password": password,
                    "projectId": self.project_id
                }
            )

            auth_data = auth_response.json()
            logger.info(f"PulsePoint auth response status: {auth_data.get('status')}")

            if auth_data.get("status") != 1:
                logger.warning(f"PulsePoint authentication failed for user: {username}")
                return None

            # Get user details
            users_response = await client.get(
                f"{self.api_url}/api/user/allusers",
                auth=(self.api_username, self.api_password)
            )

            users_data = users_response.json()
            all_users = users_data.get("data", users_data) if isinstance(users_data, dict) else users_data

            # Find the authenticated user
            user = next(
                (u for u in all_users if u.get("email", "").lower() == username.lower()),
                None
            )

            if user:
                logger.info(f"PulsePoint user found: {user.get('email')}")
                return user
            else:
                logger.warning(f"User not found in PulsePoint user list: {username}")
                return None

        except httpx.TimeoutException:
            logger.error("PulsePoint API timeout")
            raise Exception("External authentication service timed out")
        except httpx.RequestError as e:
            logger.error(f"PulsePoint API request error: {e}")
            raise Exception("External authentication service unavailable")
        except Exception as e:
            logger.error(f"Unexpected error during PulsePoint authentication: {e}")
            raise Exception("Authentication failed")

    async def check_admin_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Check if email exists in PulsePoint system and return user info.

        Args:
            email: Email address to check

        Returns:
            Dict with {exists, customerId} if found, or {exists: False} if not
        """
        try:
            client = await self._get_client()
            response = await client.get(
                f"{self.api_url}/api/user/allusers",
                auth=(self.api_username, self.api_password)
            )

            users_data = response.json()
            all_users = users_data.get("data", users_data) if isinstance(users_data, dict) else users_data

            # Find matching user
            matched_user = next(
                (u for u in all_users if u.get("email", "").lower() == email.lower()),
                None
            )

            if matched_user:
                return {
                    "exists": True,
                    "customerId": matched_user.get("id") or matched_user.get("customerId") or matched_user.get("customer_id")
                }
            return {"exists": False}

        except Exception as e:
            logger.error(f"Error checking admin email: {e}")
            return {"exists": False}


# Global singleton instance
pulsepoint_service = PulsePointService()
