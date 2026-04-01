from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import bcrypt
import jwt

from .config import settings
from .schemas import AuthUser


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(user: AuthUser) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": user.id,
        "username": user.username,
        "role": user.role,
        "stakeholderRole": user.stakeholder_role,
        "orgId": user.org_id,
        "phoneNumber": user.phone_number,
        "deviceToken": user.device_token,
        "firebaseUid": user.firebase_uid,
        "mfaEnabled": user.mfa_enabled,
        "exp": expires_at,
        "jti": uuid4().hex,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
