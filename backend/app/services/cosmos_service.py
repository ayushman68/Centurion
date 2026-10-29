"""
Azure Cosmos DB Feed Integration Service
Simulates sub-2ms point-reads from /MarketTicks container with /asset_ticker partition.
"""
from datetime import datetime, timezone
from typing import Dict, Any
from backend.app.services.storage_mock import MOCK_MARKET_TICKERS

def get_cosmos_hot_tick(asset_ticker: str) -> Dict[str, Any]:
    """
    Simulates direct point-read from Azure Cosmos DB /MarketTicks container
    using partition key /asset_ticker.
    """
    base = MOCK_MARKET_TICKERS.get(asset_ticker, {"current_price": 1.0000, "daily_volatility_index": 0.0100})
    return {
        "asset_ticker": asset_ticker,
        "current_price": base["current_price"],
        "daily_volatility_index": base["daily_volatility_index"],
        "source": "Azure Cosmos DB (/MarketTicks)",
        "partition_key": f"/asset_ticker/{asset_ticker}",
        "ingest_timestamp": datetime.now(timezone.utc).isoformat()
    }
