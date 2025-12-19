"""
AI Planner Backend - FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1.router import api_router
from app.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup: Create tables (use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: cleanup if needed
    await engine.dispose()


app = FastAPI(
    title="AI Planner API",
    description="Backend API for the AI-powered Task Planner application",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai-planner-mu-six.vercel.app",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "capacitor://localhost",
        "ionic://localhost"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

# Mount static files
# We expect the frontend files to be mounted or copied to /app/static in the container,
# or strictly speaking, they are in the parent directory of backend locally.
# In Docker, we mounted ../ to /app/static. 
# We serve the specific folders (css, js, assets) and the index.html.

static_dir = "/app/static"
if not os.path.exists(static_dir):
    # Fallback for local development without docker (assuming running from backend dir)
    static_dir = "../"

app.mount("/css", StaticFiles(directory=os.path.join(static_dir, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(static_dir, "js")), name="js")
# Mount other assets if they exist, e.g., images, icons.
if os.path.exists(os.path.join(static_dir, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

@app.get("/")
async def read_index():
    return FileResponse(os.path.join(static_dir, "index.html"))


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}
