"""
Automated Micro-Hedging Route Handlers
"""
from fastapi import APIRouter, status
from backend.app.models.hedge import HedgeExecuteRequest, HedgeExecuteResponse
from backend.app.services.hedge_service import execute_atomic_hedge

router = APIRouter(prefix="/hedge", tags=["Automated Micro-Hedging Sentry"])

@router.post(
    "/execute",
    response_model=HedgeExecuteResponse,
    status_code=status.HTTP_200_OK,
    summary="Atomic Micro-Hedging Execution via Transaction Block"
)
async def execute_hedge(payload: HedgeExecuteRequest):
    """
    POST /api/v1/hedge/execute
    - Evaluates safety constraints & risk margins.
    - Interfaces directly with Azure Cosmos DB hot ticker feeds for latest pricing.
    - Executes the multi-statement atomic transaction block.
    """
    return execute_atomic_hedge(payload)
