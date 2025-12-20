#!/bin/sh
echo "Starting backend..."
echo "PORT is set to: ${PORT}"

# Default to 8000 if PORT is not set
APP_PORT=${PORT:-8000}

echo "Starting Uvicorn on port $APP_PORT"
exec uvicorn app.main:app --host 0.0.0.0 --port $APP_PORT
