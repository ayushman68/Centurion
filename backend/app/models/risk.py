"""
Portfolio Risk & VaR Pydantic Schemas
"""
from typing import List
from datetime import datetime
from pydantic import BaseModel

class AssetHoldingDetail(BaseModel):
    asset_ticker: str
    quantity: float
    current_price: float
    market_value: float
    weight: float

class PortfolioRiskResponse(BaseModel):
    portfolio_id: int
    portfolio_name: str
    total_equity: float
    margin_threshold: float
    is_flagged_critical: bool
    parametric_var_99_1day: float
    basel_var_99_10day: float
    expected_shortfall_975: float
    weighted_volatility_index: float
    status: str
    holdings: List[AssetHoldingDetail]
    timestamp: datetime
