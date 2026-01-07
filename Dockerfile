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

# Make validation script executable
RUN chmod +x validate_env.py

# Expose port (Railway will set PORT env var dynamically)
EXPOSE 8080

# Runtime execution
# Note: No secrets are hardcoded here.
# Railway will inject them into the environment automatically at runtime.
# Validation runs first to ensure all required variables are present.
CMD ["sh", "-c", "python validate_env.py && gunicorn app:app --bind 0.0.0.0:${PORT:-8080} --workers 4 --timeout 120"]
