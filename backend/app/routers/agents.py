"""
Mobile device (Agent) management routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
import logging

from app.database import get_db
from app.models.agent import Agent
from app.schemas.common import SuccessResponse
from app.utils.dependencies import get_current_user, get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agents", tags=["Mobile Devices"])


@router.post("/register", response_model=SuccessResponse)
async def register_mobile_device(
    device_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Register a new mobile device for the current customer.
    
    Args:
        device_id: Unique device identifier
        current_user: Current authenticated user (admin or agent)
        db: Database session
        
    Returns:
        Success response with registered device info
        
    Raises:
        HTTPException 400: Device ID already registered
    """
    try:
        customer_id = current_user.customerId
        
        # Check if device_id already exists for this customer
        existing = db.query(Agent).filter(
            and_(
                Agent.device_id == device_id,
                Agent.customer_id == customer_id
            )
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Device ID '{device_id}' is already registered for this customer"
            )
        
        # Create new agent
        new_agent = Agent(
            device_id=device_id,
            customer_id=customer_id
        )
        
        db.add(new_agent)
        db.commit()
        db.refresh(new_agent)
        
        logger.info(f"Mobile device registered: {device_id} for customer {customer_id}")
        
        return SuccessResponse(
            message="Mobile device registered successfully",
            data={
                "agents_id": new_agent.agents_id,
                "device_id": new_agent.device_id,
                "customer_id": new_agent.customer_id
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error registering mobile device: {e}")
        raise HTTPException(status_code=500, detail="Failed to register mobile device")


@router.get("/list", response_model=SuccessResponse)
async def list_mobile_devices(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all mobile devices for the current customer.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Success response with list of registered devices
    """
    try:
        customer_id = current_user.customerId
        logger.info(f"[LIST] current_user object: customerId={customer_id}, userId={current_user.userId}, role={current_user.role}")
        logger.info(f"[LIST] Fetching devices for customer_id: {customer_id} (type: {type(customer_id)})")
        
        # First, let's check all agents in the table
        all_agents = db.query(Agent).all()
        logger.info(f"[LIST] Total agents in DB: {len(all_agents)}")
        for a in all_agents:
            logger.info(f"[LIST] Agent in DB - ID: {a.agents_id}, Device: {a.device_id}, Customer: {a.customer_id} (type: {type(a.customer_id)})")
        
        devices = db.query(Agent).filter(
            Agent.customer_id == customer_id
        ).order_by(Agent.agents_id.desc()).all()
        
        logger.info(f"[LIST] Found {len(devices)} devices after filtering by customer_id: {customer_id}")
        
        device_list = [
            {
                "agents_id": d.agents_id,
                "device_id": d.device_id,
                "customer_id": d.customer_id
            }
            for d in devices
        ]
        
        return SuccessResponse(
            message="Mobile devices retrieved successfully",
            data=device_list
        )
        
    except Exception as e:
        logger.error(f"Error listing mobile devices: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve mobile devices")


@router.delete("/{agents_id}", response_model=SuccessResponse)
async def delete_mobile_device(
    agents_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a mobile device registration.
    
    Args:
        agents_id: Agent ID to delete
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Success response
        
    Raises:
        HTTPException 404: Device not found
        HTTPException 403: Not authorized to delete this device
    """
    try:
        customer_id = current_user.customerId
        
        agent = db.query(Agent).filter(Agent.agents_id == agents_id).first()
        
        if not agent:
            raise HTTPException(status_code=404, detail="Mobile device not found")
        
        if agent.customer_id != customer_id:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to delete this device"
            )
        
        db.delete(agent)
        db.commit()
        
        logger.info(f"Mobile device deleted: {agent.device_id} (ID: {agents_id})")
        
        return SuccessResponse(message="Mobile device deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting mobile device: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete mobile device")
