#!/bin/bash
set -e

# Run environment validation
python validate_env.py

# Get PORT from environment or default to 8080
PORT=${PORT:-8080}

echo "Starting Gunicorn on 0.0.0.0:${PORT}"

# Start Gunicorn with dynamic port
exec gunicorn app:app \
    --bind "0.0.0.0:${PORT}" \
    --workers 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
