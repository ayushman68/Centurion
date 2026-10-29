"""
Centurion Core Configuration Settings
"""
import os
from typing import List

class Settings:
    PROJECT_NAME: str = "Centurion Enterprise Risk Engine"
    PROJECT_DESCRIPTION: str = "Institutional micro-hedging and real-time Value-at-Risk computation API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security Settings
    BCRYPT_ROUNDS: int = 12
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "centurion-institutional-enterprise-secret-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS Origins
    CORS_ORIGINS: List[str] = ["*"]
    
    # Financial Benchmarks
    DEFAULT_MARGIN_THRESHOLD: float = 0.1500  # 15.0%
    BASEL_SCALING_FACTOR: float = 3.162277  # sqrt(10)

settings = Settings()
