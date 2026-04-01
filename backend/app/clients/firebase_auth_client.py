from __future__ import annotations

import asyncio
from datetime import UTC, datetime

try:
    import firebase_admin
    from firebase_admin import auth, credentials
except Exception:  # pragma: no cover - optional runtime dependency fallback
    firebase_admin = None
    auth = None
    credentials = None

from ..config import settings
from ..schemas import AuthUser, UserCreateRequest


def _ensure_firebase_app() -> bool:
    if not settings.firebase_auth_enabled or not firebase_admin or not auth:
        return False

    if firebase_admin._apps:
        return True

    app_options = {"projectId": settings.firebase_project_id} if settings.firebase_project_id else None
    if settings.firebase_credentials_path and credentials:
        credential = credentials.Certificate(settings.firebase_credentials_path)
        firebase_admin.initialize_app(credential, options=app_options)
        return True

    if settings.firebase_project_id:
        firebase_admin.initialize_app(options=app_options)
        return True

    return False


async def verify_firebase_bearer_token(token: str) -> AuthUser | None:
    if not _ensure_firebase_app():
        return None

    try:
        payload = await asyncio.to_thread(auth.verify_id_token, token)  # type: ignore[union-attr]
    except Exception:
        return None

    username = str(payload.get("email") or payload.get("name") or payload.get("uid") or "firebase-user")
    role = str(payload.get("role") or "operator")
    return AuthUser(
        id=str(payload.get("uid")),
        username=username,
        role="admin" if role == "admin" else "operator",
        stakeholderRole=str(payload.get("stakeholderRole") or ("admin" if role == "admin" else "shipper")),
        orgId=str(payload.get("orgId") or "default-org"),
        phoneNumber=str(payload.get("phone_number")) if payload.get("phone_number") else None,
        firebaseUid=str(payload.get("uid")),
        mfaEnabled=bool(payload.get("mfa_enabled", False)),
        createdAt=datetime.now(UTC).isoformat(),
    )


async def provision_firebase_user(request: UserCreateRequest) -> dict[str, str | bool] | None:
    if not _ensure_firebase_app():
        return None

    def _create() -> dict[str, str | bool]:
        created = auth.create_user(  # type: ignore[union-attr]
            email=request.firebase_email or f"{request.username}@clearpath.local",
            password=request.password,
            display_name=request.username,
            phone_number=request.phone_number if request.phone_number and request.phone_number.startswith("+") else None,
        )
        auth.set_custom_user_claims(  # type: ignore[union-attr]
            created.uid,
            {
                "role": request.role,
                "stakeholderRole": request.stakeholder_role,
                "orgId": request.org_id,
                "mfa_enabled": request.mfa_enabled,
            },
        )
        return {"uid": created.uid, "email": created.email or "", "enabled": True}

    try:
        return await asyncio.to_thread(_create)
    except Exception:
        return {"uid": "", "email": request.firebase_email or "", "enabled": False}
