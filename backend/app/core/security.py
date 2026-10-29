"""
Centurion Cryptographic Security & Authentication Utilities
"""
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from backend.app.core.config import settings

def hash_password(password: str) -> str:
    """Hashes password using Bcrypt with 12 salt rounds (NIST SP 800-63B standard)."""
    salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against stored Bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def generate_mock_jwt(user_id: int, email: str, role_name: str) -> str:
    """Generates simulated signed RS256/HS256 JWT claim."""
    return f"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi{user_id},\"email\":\"{email}\",\"role\":\"{role_name}\"}}.synthetic_signature_verification_hash"

