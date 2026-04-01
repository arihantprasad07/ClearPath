from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import HTTPException, status

from .clients.firebase_auth_client import provision_firebase_user, verify_firebase_bearer_token
from .config import settings
from .schemas import (
    AuthLoginRequest,
    AuthTokenResponse,
    AuthUser,
    AuthUserRecord,
    DeviceTokenUpdateRequest,
    FirebaseAuthExchangeResponse,
    PasswordUpdateRequest,
    UserCreateRequest,
)
from .security import create_access_token, hash_password, verify_password
from .storage import shipment_store


def ensure_admin_user() -> None:
    existing = shipment_store.get_user_by_username(settings.admin_username)
    if existing is not None:
        return

    now = datetime.now(UTC).isoformat()
    admin_record = AuthUserRecord(
        id=f"user-{uuid4().hex[:12]}",
        username=settings.admin_username,
        role="admin",
        stakeholderRole="admin",
        orgId="default-org",
        phoneNumber=None,
        deviceToken=None,
        firebaseUid=None,
        mfaEnabled=False,
        passwordHash=hash_password(settings.admin_password),
        createdAt=now,
    )
    shipment_store.save_user(admin_record)


async def login_user(request: AuthLoginRequest) -> AuthTokenResponse:
    if settings.auth_mode == "firebase_primary" and not settings.allow_password_login:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password login is disabled. Use Firebase Authentication.",
        )

    user_record = shipment_store.get_user_by_username(request.username)
    if user_record is None or not verify_password(request.password, user_record.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password.")

    user = AuthUser(
        id=user_record.id,
        username=user_record.username,
        role=user_record.role,
        stakeholderRole=user_record.stakeholder_role,
        orgId=user_record.org_id,
        phoneNumber=user_record.phone_number,
        deviceToken=user_record.device_token,
        firebaseUid=user_record.firebase_uid,
        mfaEnabled=user_record.mfa_enabled,
        createdAt=user_record.created_at,
    )
    return AuthTokenResponse(accessToken=create_access_token(user), user=user)


async def exchange_firebase_login(id_token: str) -> FirebaseAuthExchangeResponse:
    firebase_user = await verify_firebase_bearer_token(id_token)
    if firebase_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Firebase token.")

    existing = shipment_store.get_user_by_id(firebase_user.id)
    if existing is None:
        shipment_store.save_user(
            AuthUserRecord(
                id=firebase_user.id,
                username=firebase_user.username.strip().lower(),
                role=firebase_user.role,
                stakeholderRole=firebase_user.stakeholder_role,
                orgId=firebase_user.org_id,
                phoneNumber=firebase_user.phone_number,
                deviceToken=firebase_user.device_token,
                firebaseUid=firebase_user.firebase_uid or firebase_user.id,
                mfaEnabled=firebase_user.mfa_enabled,
                passwordHash=hash_password(uuid4().hex),
                createdAt=firebase_user.created_at,
            )
        )

    app_user = AuthUser(
        id=firebase_user.id,
        username=firebase_user.username.strip().lower(),
        role=firebase_user.role,
        stakeholderRole=firebase_user.stakeholder_role,
        orgId=firebase_user.org_id,
        phoneNumber=firebase_user.phone_number,
        deviceToken=firebase_user.device_token,
        firebaseUid=firebase_user.firebase_uid,
        mfaEnabled=firebase_user.mfa_enabled,
        createdAt=firebase_user.created_at,
    )
    return FirebaseAuthExchangeResponse(firebaseVerified=True, accessToken=create_access_token(app_user), user=app_user)


def list_users() -> list[AuthUser]:
    return [
        AuthUser(
            id=user.id,
            username=user.username,
            role=user.role,
            stakeholderRole=user.stakeholder_role,
            orgId=user.org_id,
            phoneNumber=user.phone_number,
            deviceToken=user.device_token,
            firebaseUid=user.firebase_uid,
            mfaEnabled=user.mfa_enabled,
            createdAt=user.created_at,
        )
        for user in shipment_store.list_users()
    ]


async def create_user(request: UserCreateRequest) -> AuthUser:
    existing = shipment_store.get_user_by_username(request.username)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists.")

    now = datetime.now(UTC).isoformat()
    firebase_account = await provision_firebase_user(request)
    user_record = AuthUserRecord(
        id=f"user-{uuid4().hex[:12]}",
        username=request.username,
        role=request.role,
        stakeholderRole="admin" if request.role == "admin" else request.stakeholder_role,
        orgId=request.org_id,
        phoneNumber=request.phone_number,
        deviceToken=request.device_token,
        firebaseUid=str(firebase_account.get("uid")) if firebase_account and firebase_account.get("uid") else None,
        mfaEnabled=request.mfa_enabled,
        passwordHash=hash_password(request.password),
        createdAt=now,
    )
    shipment_store.save_user(user_record)
    return AuthUser(
        id=user_record.id,
        username=user_record.username,
        role=user_record.role,
        stakeholderRole=user_record.stakeholder_role,
        orgId=user_record.org_id,
        phoneNumber=user_record.phone_number,
        deviceToken=user_record.device_token,
        firebaseUid=user_record.firebase_uid,
        mfaEnabled=user_record.mfa_enabled,
        createdAt=user_record.created_at,
    )


def update_user_password(user_id: str, request: PasswordUpdateRequest) -> AuthUser:
    user_record = shipment_store.get_user_by_id(user_id)
    if user_record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    updated_user = AuthUserRecord(
        id=user_record.id,
        username=user_record.username,
        role=user_record.role,
        stakeholderRole=user_record.stakeholder_role,
        orgId=user_record.org_id,
        phoneNumber=user_record.phone_number,
        deviceToken=user_record.device_token,
        firebaseUid=user_record.firebase_uid,
        mfaEnabled=user_record.mfa_enabled,
        passwordHash=hash_password(request.password),
        createdAt=user_record.created_at,
    )
    shipment_store.save_user(updated_user)
    return AuthUser(
        id=updated_user.id,
        username=updated_user.username,
        role=updated_user.role,
        stakeholderRole=updated_user.stakeholder_role,
        orgId=updated_user.org_id,
        phoneNumber=updated_user.phone_number,
        deviceToken=updated_user.device_token,
        firebaseUid=updated_user.firebase_uid,
        mfaEnabled=updated_user.mfa_enabled,
        createdAt=updated_user.created_at,
    )


def update_device_token(user_id: str, request: DeviceTokenUpdateRequest) -> AuthUser:
    user_record = shipment_store.get_user_by_id(user_id)
    if user_record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    updated_user = AuthUserRecord(
        id=user_record.id,
        username=user_record.username,
        role=user_record.role,
        stakeholderRole=user_record.stakeholder_role,
        orgId=user_record.org_id,
        phoneNumber=user_record.phone_number,
        deviceToken=request.device_token,
        firebaseUid=user_record.firebase_uid,
        mfaEnabled=user_record.mfa_enabled,
        passwordHash=user_record.password_hash,
        createdAt=user_record.created_at,
    )
    shipment_store.save_user(updated_user)
    return AuthUser(
        id=updated_user.id,
        username=updated_user.username,
        role=updated_user.role,
        stakeholderRole=updated_user.stakeholder_role,
        orgId=updated_user.org_id,
        phoneNumber=updated_user.phone_number,
        deviceToken=updated_user.device_token,
        firebaseUid=updated_user.firebase_uid,
        mfaEnabled=updated_user.mfa_enabled,
        createdAt=updated_user.created_at,
    )
