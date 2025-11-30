# Tiltfile for Journi Development
# Starts: Frontend (Next.js) + Backend (FastAPI) + ngrok (WhatsApp webhook)

# ============== CONFIGURATION ==============
BACKEND_PORT = 8000
FRONTEND_PORT = 3000
NGROK_PORT = BACKEND_PORT  # ngrok tunnels to backend

# ============== BACKEND (FastAPI + Python) ==============
local_resource(
    'backend',
    serve_cmd='cd backend && source .venv/bin/activate && PYTHONUNBUFFERED=1 python main.py',
    serve_dir='.',
    deps=['backend/main.py', 'backend/graph.py', 'backend/room_manager.py', 'backend/services'],
    labels=['api'],
    resource_deps=[],
    auto_init=True,
    trigger_mode=TRIGGER_MODE_MANUAL,  # Don't auto-restart on file changes
)

# ============== FRONTEND (Next.js) ==============
local_resource(
    'frontend',
    serve_cmd='npm run dev',
    serve_dir='.',
    deps=['src', 'package.json'],
    labels=['web'],
    resource_deps=[],
    auto_init=True,
    trigger_mode=TRIGGER_MODE_MANUAL,
)

# ============== NGROK (WhatsApp Webhook Tunnel) ==============
# Exposes backend to internet for Twilio webhooks
# After starting, check ngrok dashboard: http://127.0.0.1:4040
local_resource(
    'ngrok',
    serve_cmd='ngrok http {} --log=stdout'.format(BACKEND_PORT),
    serve_dir='.',
    labels=['tunnel'],
    resource_deps=['backend'],
    auto_init=False,  # Start manually when needed
)

# ============== HELPER: Show URLs ==============
local_resource(
    'urls',
    cmd='''
    echo "=========================================="
    echo "  JOURNI DEV ENVIRONMENT"
    echo "=========================================="
    echo ""
    echo "  Frontend:  http://localhost:{}"
    echo "  Backend:   http://localhost:{}"
    echo "  ngrok UI:  http://127.0.0.1:4040"
    echo ""
    echo "  After ngrok starts, get the public URL from:"
    echo "  http://127.0.0.1:4040/status"
    echo ""
    echo "  Configure Twilio webhook:"
    echo "  https://<ngrok-url>/api/whatsapp/webhook"
    echo "=========================================="
    '''.format(FRONTEND_PORT, BACKEND_PORT),
    labels=['info'],
    auto_init=True,
)
