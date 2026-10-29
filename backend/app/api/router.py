"""
Central API v1 Router Aggregator
"""
from fastapi import APIRouter
from backend.app.api.v1 import auth, risk, hedge

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(risk.router)
api_router.include_router(hedge.router)
