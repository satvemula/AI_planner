from fastapi import FastAPI

app = FastAPI(title="AI Planner API", version="1.0.0")

@app.get("/health")
async def health_check():
    return {"status": "ok"}