"""
AI Planner Backend - FastAPI Application
"""
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("DEBUG: Starting application lifespan...")
    print(f"DEBUG: Current working directory: {os.getcwd()}")
    print(f"DEBUG: PORT from env is: {os.environ.get('PORT')}")
    yield

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

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}