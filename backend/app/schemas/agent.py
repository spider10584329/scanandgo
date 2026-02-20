"""
Agent schemas - device/agent registration
"""
from pydantic import BaseModel
from typing import Optional


class AgentBase(BaseModel):
    """Base agent schema"""
    device_id: str
    customer_id: int


class AgentCreate(AgentBase):
    """Create agent schema"""
    pass


class AgentResponse(AgentBase):
    """Agent response schema"""
    agents_id: int

    class Config:
        from_attributes = True
