"""
Portfolio Risk & VaR Route Handlers
"""
from fastapi import APIRouter, Path
from backend.app.models.risk import PortfolioRiskResponse
from backend.app.services.risk_service import evaluate_portfolio_risk

router = APIRouter(prefix="/risk", tags=["Portfolio Risk & VaR Engine"])

@router.get(
    "/portfolio/{portfolio_id}",
    response_model=PortfolioRiskResponse,
    summary="Real-Time Portfolio Risk Exposure & VaR Analysis"
)
async def get_portfolio_risk(
    portfolio_id: int = Path(..., ge=1, description="Portfolio Relational ID")
):
    """
    GET /api/v1/risk/portfolio/{id}
    - Triggers stored procedure CalculatePortfolioExposure via raw transaction strings:
      `EXEC CalculatePortfolioExposure @PortfolioID = :portfolio_id;`
    - Recalculates total portfolio equity via INNER JOIN on asset_holdings and market_tickers.
    - Evaluates parametric Value-at-Risk (VaR 99%) and Expected Shortfall (ES 97.5%).
    """
    return evaluate_portfolio_risk(portfolio_id)
