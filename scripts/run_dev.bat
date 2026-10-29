@echo off
echo ==========================================================
echo Centurion Institutional Risk Engine - Launching Services
echo ==========================================================

start "Centurion Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
start "Centurion Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo Services launched!
echo - Frontend: http://127.0.0.1:5173
echo - Backend API: http://127.0.0.1:8000
echo - Swagger Docs: http://127.0.0.1:8000/docs
