from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt

from .clients.firebase_auth_client import verify_firebase_bearer_token
from .config import settings
from .schemas import AuthUser
from .security import decode_access_token
from .storage import shipment_store

bearer_scheme = HTTPBearer(auto_error=False)


def _resolve_user_from_access_token(token: str) -> AuthUser | None:
    payload = decode_access_token(token)
    user = shipment_store.get_user_by_id(str(payload.get("sub")))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    if settings.auth_mode == "firebase_primary":
        try:
            return _resolve_user_from_access_token(credentials.credentials)
        except jwt.PyJWTError:
            pass
        firebase_user = await verify_firebase_bearer_token(credentials.credentials)
        if firebase_user is not None:
            return firebase_user
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Valid Firebase authentication required.")

    try:
        return _resolve_user_from_access_token(credentials.credentials)
    except jwt.PyJWTError:
        firebase_user = await verify_firebase_bearer_token(credentials.credentials)
        if firebase_user is not None:
            return firebase_user
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")


async def require_admin(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    if settings.require_admin_mfa and not current_user.mfa_enabled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin MFA is required.")
    return current_user
