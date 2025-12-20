"""
API v1 Router - aggregates all API routes.
"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.calendar import router as calendar_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(tasks_router)
api_router.include_router(calendar_router)