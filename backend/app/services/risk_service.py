"""
Portfolio Risk & VaR Computation Service
Simulates stored procedure CalculatePortfolioExposure execution and evaluates parametric metrics.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import HTTPException, status

from backend.app.services.storage_mock import MOCK_PORTFOLIOS, MOCK_MARKET_TICKERS
from backend.app.models.risk import AssetHoldingDetail, PortfolioRiskResponse
from backend.app.core.risk_math import (
    compute_parametric_var_99_1day,
    compute_basel_scaled_var_10day,
    compute_expected_shortfall
)

def evaluate_portfolio_risk(portfolio_id: int) -> PortfolioRiskResponse:
    """
    Executes simulated stored procedure CalculatePortfolioExposure:
    INNER JOIN asset_holdings ON market_tickers.
    Calculates 1-Day VaR (99%), Basel III 10-Day VaR, and Expected Shortfall.
    """
    portfolio = MOCK_PORTFOLIOS.get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio ID {portfolio_id} not found."
        )

    holdings_calc = []
    total_recalculated_equity = 0.0
    weighted_vol_accum = 0.0

    for h in portfolio["holdings"]:
        ticker = h["asset_ticker"]
        market_data = MOCK_MARKET_TICKERS.get(ticker, {"current_price": 100.0, "daily_volatility_index": 0.015})
        price = market_data["current_price"]
        vol = market_data["daily_volatility_index"]
        mkt_value = h["quantity"] * price
        total_recalculated_equity += mkt_value
        weighted_vol_accum += mkt_value * vol
        holdings_calc.append({
            "ticker": ticker,
            "quantity": h["quantity"],
            "price": price,
            "market_value": mkt_value,
            "volatility": vol
        })

    portfolio["total_equity"] = total_recalculated_equity
    weighted_vol = weighted_vol_accum / total_recalculated_equity if total_recalculated_equity > 0 else 0.015

    detailed_holdings = [
        AssetHoldingDetail(
            asset_ticker=item["ticker"],
            quantity=item["quantity"],
            current_price=item["price"],
            market_value=item["market_value"],
            weight=round(item["market_value"] / total_recalculated_equity, 4) if total_recalculated_equity > 0 else 0.0
        )
        for item in holdings_calc
    ]

    var_99_1day = compute_parametric_var_99_1day(total_recalculated_equity, weighted_vol)
    basel_var_10day = compute_basel_scaled_var_10day(var_99_1day)
    es_975 = compute_expected_shortfall(total_recalculated_equity, weighted_vol)

    var_pct = var_99_1day / total_recalculated_equity if total_recalculated_equity > 0 else 0.0
    is_critical = bool(portfolio["is_flagged_critical"] or (var_pct > portfolio["margin_threshold"]))
    portfolio["is_flagged_critical"] = 1 if is_critical else 0

    return PortfolioRiskResponse(
        portfolio_id=portfolio_id,
        portfolio_name=portfolio["portfolio_name"],
        total_equity=round(total_recalculated_equity, 2),
        margin_threshold=portfolio["margin_threshold"],
        is_flagged_critical=is_critical,
        parametric_var_99_1day=round(var_99_1day, 2),
        basel_var_99_10day=round(basel_var_10day, 2),
        expected_shortfall_975=round(es_975, 2),
        weighted_volatility_index=round(weighted_vol, 6),
        status="CRITICAL_MARGIN_BREACH" if is_critical else "NORMAL_DELTA_NEUTRAL",
        holdings=detailed_holdings,
        timestamp=datetime.now(timezone.utc)
    )
