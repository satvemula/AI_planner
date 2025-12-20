"""
AI Planner Backend - FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base

app = FastAPI(
    title="AI Planner API",
    description="Backend API for the AI-powered Task Planner application",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
    print("Lifespan startup complete, yielding control to app...")
    yield  # App runs here
    print("App shutting down...")
    
    try:
        await engine.dispose()
        print("Database disposed successfully")
    except Exception as e:
        print(f"Error disposing database: {e}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}