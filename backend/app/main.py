"""
AI Planner Backend - FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("🚀 STARTUP: Creating database tables...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print("✅ STARTUP: Tables created")
    except Exception as e:
        print(f"❌ STARTUP ERROR: {e}")
        raise
    
    print("✅ STARTUP COMPLETE - App is ready for requests")
    yield
    print("🛑 SHUTDOWN: Disposing database...")
    await engine.dispose()
    print("✅ SHUTDOWN COMPLETE")


app = FastAPI(
    title="AI Planner API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    print("📍 Health endpoint called")
    return {"status": "ok"}