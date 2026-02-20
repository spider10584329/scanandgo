"""
Common schemas shared across multiple endpoints
"""
from pydantic import BaseModel
from typing import Optional, List, Generic, TypeVar

T = TypeVar('T')


class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = True
    message: Optional[str] = None
    user: Optional[dict] = None  # For user update responses
    data: Optional[dict | list] = None  # For general data responses


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: str
    details: Optional[str] = None


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = 1
    pageSize: int = 50

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.pageSize

    @property
    def limit(self) -> int:
        return self.pageSize


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper"""
    success: bool = True
    data: List[T]
    pagination: dict

    class Config:
        from_attributes = True
