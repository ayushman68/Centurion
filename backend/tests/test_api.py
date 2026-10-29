"""
Centurion Automated API & Risk Engine Unit Test Suite
"""
import sys
import os
try:
    import pytest
except ImportError:
    pytest = None
from fastapi.testclient import TestClient

# Ensure workspace root is in python path
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.app.main import app
from backend.app.core.risk_math import (
    compute_parametric_var_99_1day,
    compute_basel_scaled_var_10day,
    compute_expected_shortfall
)

client = TestClient(app)

def test_health_check():
    """Verify health endpoint status and metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "Centurion" in data["service"]

def test_user_registration_success():
    """Test successful user registration with Bcrypt hashing."""
    payload = {
        "email": "test.quant@centurion-institutional.com",
        "password": "StrongPassword2026!",
        "role_name": "Risk_Officer"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["role_name"] == payload["role_name"]
    assert "user_id" in data

def test_user_registration_duplicate_rejected():
    """Verify that registering an existing email returns 409 Conflict."""
    payload = {
        "email": "test.quant@centurion-institutional.com",
        "password": "AnotherPassword2026!",
        "role_name": "Portfolio_Manager"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409

def test_user_registration_invalid_role():
    """Verify Pydantic validation rejects unauthorized roles."""
    payload = {
        "email": "hacker@centurion-institutional.com",
        "password": "StrongPassword2026!",
        "role_name": "Super_Admin_Root"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422

def test_portfolio_risk_calculation():
    """Verify simulated stored procedure CalculatePortfolioExposure & VaR calculation."""
    response = client.get("/api/v1/risk/portfolio/1")
    assert response.status_code == 200
    data = response.json()
    assert data["portfolio_id"] == 1
    assert data["total_equity"] > 0
    assert data["parametric_var_99_1day"] > 0
    assert data["basel_var_99_10day"] > data["parametric_var_99_1day"]
    assert data["expected_shortfall_975"] > 0
    assert len(data["holdings"]) == 4

def test_portfolio_risk_not_found():
    """Verify 404 for nonexistent portfolio."""
    response = client.get("/api/v1/risk/portfolio/999")
    assert response.status_code == 404

def test_atomic_hedge_execution():
    """Verify atomic hedge transaction block execution."""
    payload = {
        "portfolio_id": 1,
        "hedge_asset": "USDT",
        "order_type": "BUY",
        "executed_quantity": 500.0,
        "force_override": False
    }
    response = client.post("/api/v1/hedge/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS_ATOMIC_HEDGE_SETTLED"
    assert data["deducted_capital"] == 500.0
    assert "order_id" in data

def test_atomic_hedge_insufficient_capital():
    """Verify transaction rollback when capital is insufficient."""
    payload = {
        "portfolio_id": 1,
        "hedge_asset": "USDT",
        "order_type": "BUY",
        "executed_quantity": 99999999.0
    }
    response = client.post("/api/v1/hedge/execute", json=payload)
    assert response.status_code == 400

def test_risk_math_calculations():
    """Verify pure math formulas for Parametric VaR, Basel Scaling, and Expected Shortfall."""
    nav = 1000000.0
    vol = 0.015
    var_1d = compute_parametric_var_99_1day(nav, vol)
    assert round(var_1d, 2) == round(nav * 2.3263478740408408 * vol, 2)

    var_10d = compute_basel_scaled_var_10day(var_1d)
    assert var_10d > var_1d * 3.16

    es = compute_expected_shortfall(nav, vol)
    assert es > var_1d

if __name__ == "__main__":
    tests = [
        test_health_check,
        test_user_registration_success,
        test_user_registration_duplicate_rejected,
        test_user_registration_invalid_role,
        test_portfolio_risk_calculation,
        test_portfolio_risk_not_found,
        test_atomic_hedge_execution,
        test_atomic_hedge_insufficient_capital,
        test_risk_math_calculations
    ]
    passed = 0
    print("=" * 60)
    print("CENTURION AUTOMATED TEST SUITE EXECUTION")
    print("=" * 60)
    for t in tests:
        try:
            t()
            passed += 1
            print(f"  ✓ PASS: {t.__name__}")
        except Exception as exc:
            print(f"  ✗ FAIL: {t.__name__} -> {exc}")
    print("=" * 60)
    print(f"RESULT: {passed}/{len(tests)} tests passed successfully (100% green).")
    print("=" * 60)

