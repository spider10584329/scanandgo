"""
FastAPI main application entry point
Updated: Added agents router for mobile device management
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
import sys

from app.config import settings
from app.database import test_db_connection, init_db, get_db
from app.routers import auth, inventories, items, users, analytics, admin, external_api, snapshots, android, agents
from app.routers.locations import (
    router_buildings, router_areas, router_floors, router_detail_locations
)
from app.routers.items import router_items, router_categories
from app.utils.dependencies import get_current_user
from app.services.pulsepoint import pulsepoint_service

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.LOG_LEVEL == "INFO" else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="ScanAndGo Backend API",
    description="Inventory Management System Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting ScanAndGo Backend API...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"CORS origins: {settings.cors_origins_list}")

    # Test database connection
    if test_db_connection():
        logger.info("Database connection successful")
    else:
        logger.error("Database connection failed")
        raise Exception("Database connection failed")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down ScanAndGo Backend API...")
    # Close PulsePoint HTTP client
    await pulsepoint_service.close()
    logger.info("PulsePoint service closed")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "ScanAndGo Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }


# Client info endpoints
@app.get("/api/client")
async def get_client_info(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.client import Client
    
    # Get client from database
    client = db.query(Client).filter(
        Client.customer_id == current_user.customerId
    ).first()
    
    if not client:
        # Create default client if doesn't exist
        client = Client(
            customer_id=current_user.customerId,
            clientname=f"Client_{current_user.customerId}"
        )
        db.add(client)
        db.commit()
        db.refresh(client)
    
    return {
        "success": True,
        "clientname": client.clientname
    }


@app.put("/api/client")
async def update_client_info(
    request: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.client import Client
    
    # Get client from database
    client = db.query(Client).filter(
        Client.customer_id == current_user.customerId
    ).first()
    
    if not client:
        # Create new client
        client = Client(
            customer_id=current_user.customerId,
            clientname=request.get("clientname", f"Client_{current_user.customerId}")
        )
        db.add(client)
    else:
        # Update existing client
        if "clientname" in request:
            client.clientname = request["clientname"]
    
    db.commit()
    db.refresh(client)
    
    return {
        "success": True,
        "message": "Client name updated successfully",
        "clientname": client.clientname
    }


# Initialize database endpoint (admin only)
@app.post("/api/init")
async def initialize_database():
    """Initialize database tables"""
    try:
        init_db()
        return {"message": "Database initialized successfully"}
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to initialize database"}
        )


# Include routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(inventories.router)
app.include_router(router_items)
app.include_router(router_categories)
app.include_router(users.router)
app.include_router(agents.router)
app.include_router(router_buildings)
app.include_router(router_areas)
app.include_router(router_floors)
app.include_router(router_detail_locations)
app.include_router(snapshots.router)
app.include_router(analytics.router)
app.include_router(external_api.router)
app.include_router(android.router)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "details": str(exc) if settings.ENVIRONMENT == "development" else None
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        workers=1 if settings.RELOAD else settings.WORKERS
    )
