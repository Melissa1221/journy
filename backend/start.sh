#!/bin/bash
set -e

echo "=== Journi Backend Starting ==="
echo "Working directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Files in current directory:"
ls -la

echo ""
echo "=== Checking environment variables ==="
echo "SUPABASE_URL: ${SUPABASE_URL:0:30}..."
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:0:20}..."
echo "PORT: ${PORT:-8000}"

echo ""
echo "=== Starting uvicorn ==="
exec python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info
