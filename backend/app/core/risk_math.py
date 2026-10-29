"""
Centurion Quantitative Risk Math Engine
Implements Parametric Value-at-Risk (VaR), Expected Shortfall (CVaR), and Basel III Scaling.
"""
import math
import numpy as np
from typing import Dict, Any, List

# Standard normal quantile Z_alpha for 99% confidence (one-tailed)
Z_99: float = 2.3263478740408408

# Standard normal density phi(Z_99) / (1 - 0.99) for Expected Shortfall
# phi(2.3263) ≈ 0.026652, 0.026652 / 0.01 = 2.6652
ES_975_FACTOR: float = 2.665160

def compute_parametric_var_99_1day(total_equity: float, weighted_volatility: float) -> float:
    """
    Computes 1-Day Parametric Value-at-Risk at 99.0% confidence:
    VaR_99%(1d) = NAV * Z_0.99 * sigma_p
    """
    if total_equity <= 0:
        return 0.0
    return total_equity * Z_99 * weighted_volatility

def compute_basel_scaled_var_10day(var_1day: float) -> float:
    """
    Computes Basel III 10-Day Horizon Scaled VaR using Square-Root-of-Time Rule:
    VaR(10d) = VaR(1d) * sqrt(10)
    """
    return var_1day * math.sqrt(10.0)

def compute_expected_shortfall(total_equity: float, weighted_volatility: float) -> float:
    """
    Computes Conditional VaR / Expected Shortfall (CVaR) under standard Gaussian assumption:
    ES_alpha = NAV * (phi(Z_alpha) / (1 - alpha)) * sigma_p
    """
    if total_equity <= 0:
        return 0.0
    return total_equity * ES_975_FACTOR * weighted_volatility
