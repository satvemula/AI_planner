#!/bin/bash
cd "$(dirname "$0")/backend"
echo "🚀 Starting Backend Server..."
echo "📍 Server will be available at: http://localhost:8000"
source venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000


