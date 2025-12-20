#!/bin/sh
set -e

echo "Starting backend entrypoint script..."
echo "Current directory: $(pwd)"
echo "Listing directory contents:"
ls -la

echo "Checking PORT variable..."
if [ -z "$PORT" ]; then
    echo "PORT is not set, defaulting to 8000"
    APP_PORT=8000
else
    echo "PORT is set to: $PORT"
    APP_PORT=$PORT
fi

echo "Starting Uvicorn on 0.0.0.0:$APP_PORT"
exec uvicorn app.main:app --host 0.0.0.0 --port $APP_PORT --log-level info
