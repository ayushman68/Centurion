"""
Automated Micro-Hedging Pydantic Schemas
"""
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

class HedgeExecuteRequest(BaseModel):
    portfolio_id: int = Field(..., ge=1, description="Target portfolio ID")
    hedge_asset: str = Field(default="USDT", max_length=20, description="Hedge vehicle asset ticker")
    order_type: str = Field(..., description="BUY or SELL")
    executed_quantity: float = Field(..., gt=0, description="Order quantity")
    force_override: bool = Field(default=False, description="Manual supervisor override flag")

    @field_validator("order_type")
    def validate_order_type(cls, v: str) -> str:
        if v.upper() not in {"BUY", "SELL"}:
            raise ValueError("order_type must be either 'BUY' or 'SELL'")
        return v.upper()

class HedgeExecuteResponse(BaseModel):
    order_id: int
    portfolio_id: int
    hedge_asset: str
    order_type: str
    executed_quantity: float
    execution_price: float
    deducted_capital: float
    remaining_equity: float
    is_flagged_critical: bool
    status: str
    cosmos_tick_timestamp: str
    executed_at: datetime
