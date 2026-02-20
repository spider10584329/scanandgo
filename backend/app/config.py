"""
Application configuration management
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""

    # Database
    DATABASE_URL: str

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 12

    # PulsePoint API
    PULSEPOINT_API_URL: str = "https://api.pulsepoint.clinotag.com"
    PULSEPOINT_PROJECT_ID: int = 20
    PULSEPOINT_API_USERNAME: str = ""
    PULSEPOINT_API_PASSWORD: str = ""

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    RELOAD: bool = False

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # Environment
    ENVIRONMENT: str = "production"

    # Redis/Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_ENABLED: bool = False
    CACHE_TTL_SECONDS: int = 60

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
