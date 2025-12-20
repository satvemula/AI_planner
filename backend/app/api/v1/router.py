"""
API v1 Router - test endpoint only.
"""
from fastapi import APIRouter

api_router = APIRouter()

@api_router.get("/test")
async def test_endpoint():
    """Simple test endpoint."""
    return {"message": "API is working"}