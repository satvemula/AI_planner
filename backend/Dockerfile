# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Install system dependencies (needed for some python packages like psycopg2)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application code
COPY . .

# Create a directory for frontend static files (will be mounted or copied)
RUN mkdir -p /app/static

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run the application using Gunicorn (production) or Uvicorn (dev)
# Using uvicorn directly for simplicity in this setup as gunicorn needs a config file or long command
# Copy and setup entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Run the application using the entrypoint script
# Use ENTRYPOINT to prevent Railway from overriding it with a default command
ENTRYPOINT ["./entrypoint.sh"]
