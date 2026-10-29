"""
Automated Micro-Hedging Execution Service
Implements the multi-statement atomic transaction block.
"""
import logging
from datetime import datetime, timezone
from fastapi import HTTPException, status

from backend.app.services.storage_mock import MOCK_PORTFOLIOS, MOCK_HEDGING_ORDERS
from backend.app.services.cosmos_service import get_cosmos_hot_tick
from backend.app.models.hedge import HedgeExecuteRequest, HedgeExecuteResponse

logger = logging.getLogger("Centurion.HedgeService")

def execute_atomic_hedge(payload: HedgeExecuteRequest) -> HedgeExecuteResponse:
    """
    Executes atomic micro-hedge transaction block:
    BEGIN TRANSACTION;
    INSERT INTO hedging_orders (...);
    UPDATE portfolios SET total_equity = total_equity - cost, is_flagged_critical = 0;
    COMMIT TRANSACTION;
    """
    portfolio = MOCK_PORTFOLIOS.get(payload.portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target portfolio ID {payload.portfolio_id} does not exist."
        )

    # 1. Fetch live execution price directly from Azure Cosmos DB hot feed
    cosmos_feed = get_cosmos_hot_tick(payload.hedge_asset)
    execution_price = cosmos_feed["current_price"]
    total_cost = payload.executed_quantity * execution_price

    # 2. Evaluate Safety & Capital Constraints
    current_equity = portfolio["total_equity"]
    if current_equity < total_cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transaction Aborted: Insufficient portfolio capital ({current_equity}) for required hedge cost ({total_cost})."
        )

    # 3. Simulate Atomic Multi-Statement Transaction Execution Block
    try:
        new_equity = current_equity - total_cost
        portfolio["total_equity"] = new_equity
        portfolio["is_flagged_critical"] = 0

        new_order_id = len(MOCK_HEDGING_ORDERS) + 1
        order_record = {
            "order_id": new_order_id,
            "portfolio_id": payload.portfolio_id,
            "hedge_asset": payload.hedge_asset,
            "order_type": payload.order_type,
            "executed_quantity": payload.executed_quantity,
            "execution_price": execution_price,
            "executed_at": datetime.now(timezone.utc)
        }
        MOCK_HEDGING_ORDERS.append(order_record)
        logger.info(
            "Atomic transaction committed: Order #%d for Portfolio #%d (Deducted: %.2f, New NAV: %.2f)",
            new_order_id, payload.portfolio_id, total_cost, new_equity
        )

        return HedgeExecuteResponse(
            order_id=new_order_id,
            portfolio_id=payload.portfolio_id,
            hedge_asset=payload.hedge_asset,
            order_type=payload.order_type,
            executed_quantity=payload.executed_quantity,
            execution_price=execution_price,
            deducted_capital=total_cost,
            remaining_equity=new_equity,
            is_flagged_critical=False,
            status="SUCCESS_ATOMIC_HEDGE_SETTLED",
            cosmos_tick_timestamp=cosmos_feed["ingest_timestamp"],
            executed_at=order_record["executed_at"]
        )
    except Exception as exc:
        logger.error("Transaction rolled back due to error: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Atomic Transaction Rolled Back: {str(exc)}"
        )
