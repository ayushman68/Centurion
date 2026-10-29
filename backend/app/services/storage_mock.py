"""
In-Memory Institutional Storage Layer
Simulates Azure SQL Database 3NF Tables & Transaction Logs.
"""
from typing import Dict, Any, List

MOCK_USERS: Dict[int, Dict[str, Any]] = {}

MOCK_PORTFOLIOS: Dict[int, Dict[str, Any]] = {
    1: {
        "portfolio_id": 1,
        "user_id": 1,
        "portfolio_name": "Centurion Quantitative Macro Alpha [ACC-001]",
        "total_equity": 1000000.0000,
        "margin_threshold": 0.1500,  # 15.0% risk threshold
        "is_flagged_critical": 0,
        "holdings": [
            {"asset_ticker": "AAPL", "quantity": 2500.0, "average_buy_price": 175.00},
            {"asset_ticker": "MSFT", "quantity": 1200.0, "average_buy_price": 400.00},
            {"asset_ticker": "NVDA", "quantity": 1500.0, "average_buy_price": 110.00},
            {"asset_ticker": "SPY",  "quantity": 400.0,  "average_buy_price": 495.00},
        ]
    }
}

MOCK_MARKET_TICKERS: Dict[str, Dict[str, Any]] = {
    "AAPL": {"current_price": 185.5000, "daily_volatility_index": 0.0182},
    "MSFT": {"current_price": 420.2500, "daily_volatility_index": 0.0164},
    "NVDA": {"current_price": 125.0000, "daily_volatility_index": 0.0345},
    "SPY":  {"current_price": 505.0000, "daily_volatility_index": 0.0112},
    "USDT": {"current_price": 1.0000,   "daily_volatility_index": 0.0001},
}

MOCK_HEDGING_ORDERS: List[Dict[str, Any]] = []
MOCK_AUDIT_LEDGER: List[Dict[str, Any]] = []
