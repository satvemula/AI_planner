"""
API v1 Router - aggregates all API routes.
"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router

api_router = APIRouter()

# Include only auth router for now
api_router.include_router(auth_router)

# TODO: Add tasks and calendar routers after fixing imports