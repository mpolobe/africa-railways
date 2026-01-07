# Use a clean base image
FROM python:3.11-slim

# Install system-level build tools for pysui-fastcrypto
RUN apt-get update && apt-get install -y \
    gcc \
    pkg-config \
    libssl-dev \
    cargo \
    rustc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Securely handle dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project files (excluding secrets via .dockerignore)
COPY . .

# Runtime execution
# Note: No secrets are hardcoded here.
# Railway will inject them into the environment automatically at runtime.
CMD ["gunicorn", "backend.app:app", "--bind", "0.0.0.0:8080", "--workers", "4", "--timeout", "120"]
