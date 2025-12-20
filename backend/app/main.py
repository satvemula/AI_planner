"""
AI Planner Backend - FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1.router import api_router
from app.database import engine, Base
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("Starting lifespan...")
    try:
        print("Creating database tables...")
        async with engine.begin() as conn:
            print("Engine connected")
            await conn.run_sync(Base.metadata.create_all)
            print("Tables created successfully")
    except Exception as e:
        print(f"ERROR in lifespan: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    
    print("Lifespan startup complete")
    yield
    
    print("Shutting down...")
    await engine.dispose()
    print("Shutdown complete")

app = FastAPI(
    title="AI Planner API",
    description="Backend API for the AI-powered Task Planner application",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - MUST be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
#app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}