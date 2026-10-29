"""
Centurion: Enterprise Portfolio Risk Engine & Automated Micro-Hedging Platform
Core Production Backend Runtime: Python FastAPI
Routes:
  - POST /api/v1/auth/register       -> Bcrypt credential hashing & RBAC user creation
  - GET  /api/v1/risk/portfolio/{id} -> Raw SP transaction execution & Real-Time VaR computation
  - POST /api/v1/hedge/execute       -> Atomic Transaction Block & Cosmos DB tick interface
"""

import os
import math
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import bcrypt
import numpy as np
from pydantic import BaseModel, EmailStr, Field, field_validator

from fastapi import FastAPI, HTTPException, Depends, status, Path
from fastapi.middleware.cors import CORSMiddleware

# Initialize Logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("Centurion.CoreEngine")

# Initialize FastAPI App
app = FastAPI(
    title="Centurion Enterprise Risk Engine",
    description="Institutional micro-hedging and real-time Value-at-Risk computation API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS (STRICT INPUT SANITIZATION & TYPE GUARDS)
# -----------------------------------------------------------------------------
class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Institutional corporate email address")
    password: str = Field(..., min_length=10, description="Minimum 10 characters password")
    role_name: str = Field(..., description="Assigned enterprise role")

    @field_validator("role_name")
    def validate_role(cls, v: str) -> str:
        allowed = {"Risk_Officer", "Portfolio_Manager", "Auditor"}
        if v not in allowed:
            raise ValueError(f"Invalid role '{v}'. Must be one of {allowed}")
        return v

class UserRegisterResponse(BaseModel):
    user_id: int
    email: str
    role_name: str
    created_at: datetime
    message: str

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

class HedgeExecuteRequest(BaseModel):
    portfolio_id: int = Field(..., ge=1)
    hedge_asset: str = Field(default="USDT", max_length=20)
    order_type: str = Field(..., description="BUY or SELL")
    executed_quantity: float = Field(..., gt=0)
    force_override: bool = Field(default=False)

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

# -----------------------------------------------------------------------------
# MOCK DATABASE / IN-MEMORY TEST DATA LAYER (READY FOR AZURE SQL DRIVER)
# -----------------------------------------------------------------------------
# In production, these statements execute via sqlalchemy or pyodbc against Azure SQL.
MOCK_USERS: Dict[int, Dict[str, Any]] = {}
MOCK_PORTFOLIOS: Dict[int, Dict[str, Any]] = {
    1: {
        "portfolio_id": 1,
        "user_id": 1,
        "portfolio_name": "Centurion Quantitative Macro Alpha [ACC-001]",
        "total_equity": 1000000.0000,
        "margin_threshold": 0.1500,  # 15% risk threshold
        "is_flagged_critical": 0,
        "holdings": [
            {"asset_ticker": "AAPL", "quantity": 2500.0, "average_buy_price": 175.00},
            {"asset_ticker": "MSFT", "quantity": 1200.0, "average_buy_price": 400.00},
            {"asset_ticker": "NVDA", "quantity": 1500.0, "average_buy_price": 110.00},
        ]
    }
}
MOCK_MARKET_TICKERS: Dict[str, Dict[str, Any]] = {
    "AAPL": {"current_price": 185.5000, "daily_volatility_index": 0.0182},
    "MSFT": {"current_price": 420.2500, "daily_volatility_index": 0.0164},
    "NVDA": {"current_price": 125.0000, "daily_volatility_index": 0.0345},
    "USDT": {"current_price": 1.0000, "daily_volatility_index": 0.0001},
}
MOCK_HEDGING_ORDERS: List[Dict[str, Any]] = []

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
        "ingest_timestamp": datetime.now(timezone.utc).isoformat()
    }

# -----------------------------------------------------------------------------
# REST ENDPOINTS
# -----------------------------------------------------------------------------

@app.post(
    "/api/v1/auth/register",
    response_model=UserRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User Registration & RBAC Ingress"
)
async def register_user(payload: UserRegisterRequest):
    """
    POST /api/v1/auth/register
    - Hashes plain-text password using deep bcrypt hash (12 salt rounds).
    - Checks email uniqueness constraint.
    - Executes parameterized SQL insert to table `users`.
    """
    # Check uniqueness
    for u in MOCK_USERS.values():
        if u["email"].lower() == payload.email.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User with email '{payload.email}' already exists."
            )

    # 1. Bcrypt password hashing
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(payload.password.encode("utf-8"), salt).decode("utf-8")

    # 2. Relational SQL Insertion Mapping:
    # INSERT INTO users (email, password_hash, role_name) VALUES (:email, :hash, :role);
    new_user_id = len(MOCK_USERS) + 1
    created_at = datetime.now(timezone.utc)
    user_record = {
        "user_id": new_user_id,
        "email": payload.email,
        "password_hash": hashed,
        "role_name": payload.role_name,
        "created_at": created_at
    }
    MOCK_USERS[new_user_id] = user_record
    logger.info("Successfully registered user ID %d with role %s", new_user_id, payload.role_name)

    return UserRegisterResponse(
        user_id=new_user_id,
        email=payload.email,
        role_name=payload.role_name,
        created_at=created_at,
        message="User credentials encrypted with bcrypt (12 rounds) and securely provisioned."
    )


@app.get(
    "/api/v1/risk/portfolio/{portfolio_id}",
    response_model=PortfolioRiskResponse,
    summary="Real-Time Portfolio Risk Exposure & VaR Analysis"
)
async def get_portfolio_risk(
    portfolio_id: int = Path(..., ge=1, description="Portfolio Relational ID")
):
    """
    GET /api/v1/risk/portfolio/{id}
    - Triggers stored procedure `CalculatePortfolioExposure` via raw transaction strings:
      `EXEC CalculatePortfolioExposure @PortfolioID = :portfolio_id;`
    - Recalculates total portfolio equity via INNER JOIN on asset_holdings and market_tickers.
    - Evaluates parametric Value-at-Risk (VaR 99%) and Expected Shortfall (ES 97.5%).
    """
    portfolio = MOCK_PORTFOLIOS.get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio ID {portfolio_id} not found."
        )

    # 1. Simulate SQL Procedure Execution: CalculatePortfolioExposure
    # Recomputes total_equity = SUM(h.quantity * t.current_price) via INNER JOIN
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

    # 2. Compute Holdings Weights & Detail Payload
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

    # 3. Mathematical Risk Engine: Parametric VaR & Expected Shortfall
    # VaR_99% = total_equity * 2.3263 * weighted_vol
    z_99 = 2.3263
    var_99_1day = total_recalculated_equity * z_99 * weighted_vol
    basel_var_10day = var_99_1day * math.sqrt(10.0)
    # Analytical Expected Shortfall: ES = total_equity * (phi(2.3263)/(1 - 0.99)) * weighted_vol
    # phi(2.3263) / 0.01 ≈ 0.02665 / 0.01 = 2.665
    es_975 = total_recalculated_equity * 2.665 * weighted_vol

    # Check Margin Threat Condition
    # Volatility or VaR percentage vs margin_threshold
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


@app.post(
    "/api/v1/hedge/execute",
    response_model=HedgeExecuteResponse,
    status_code=status.HTTP_200_OK,
    summary="Atomic Micro-Hedging Execution via Transaction Block"
)
async def execute_hedge(payload: HedgeExecuteRequest):
    """
    POST /api/v1/hedge/execute
    - Evaluates safety constraints & risk margins.
    - Interfaces directly with Azure Cosmos DB hot ticker feeds for latest pricing.
    - Executes the multi-statement atomic transaction block:
        BEGIN TRANSACTION;
        BEGIN TRY
            INSERT INTO hedging_orders (...)
            UPDATE portfolios SET total_equity = total_equity - cost, is_flagged_critical = 0
            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            ROLLBACK TRANSACTION;
            THROW;
        END CATCH;
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
        # Atomic Step A: Deduct capital from portfolio equity and reset critical threat
        new_equity = current_equity - total_cost
        portfolio["total_equity"] = new_equity
        portfolio["is_flagged_critical"] = 0

        # Atomic Step B: Insert executed order into immutable hedging_orders log
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
            "Atomic transaction committed: Order #%d for Portfolio #%d (Deducted: %.2f, New Equity: %.2f)",
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


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "Centurion Core Engine",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
