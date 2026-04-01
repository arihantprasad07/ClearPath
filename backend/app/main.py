from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from .auth_service import create_user, ensure_admin_user, exchange_firebase_login, list_users, login_user, update_device_token, update_user_password
from .clients.geocoding_client import geocode_location
from .config import settings
from .dependencies import get_current_user, require_admin
from .errors import RequestLoggingMiddleware, SecurityHeadersMiddleware, register_exception_handlers
from .logging_config import configure_logging
from .schemas import (
    AnalyzeRequest,
    AuditTrailResponse,
    AuthLoginRequest,
    AuthUser,
    DeviceTokenUpdateRequest,
    FirebaseAuthExchangeRequest,
    GeocodeRequest,
    GeocodeResponse,
    HealthResponse,
    ShipmentCreateRequest,
    ShipmentListResponse,
    ShipmentRouteUpdateRequest,
    PasswordUpdateRequest,
    UserCreateRequest,
    UserListResponse,
)
from .services.analyze_service import analyze_route_pair
from .services.event_service import list_operational_events
from .services.shipment_service import apply_route, create_shipment, list_shipments, refresh_shipment
from .services.shipment_service import get_shipment
from .services.monitoring_service import shipment_monitor
from .storage import shipment_store

configure_logging()


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_admin_user()
    await shipment_monitor.start()
    try:
        yield
    finally:
        await shipment_monitor.stop()


app = FastAPI(title=settings.app_name, version="2.0.0", lifespan=lifespan)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    database_status = shipment_store.health_summary()
    auth_mode = settings.auth_mode
    health_payload = HealthResponse(
        status=(
            "ok"
            if database_status in {"firestore", "sqlite"}
            and not (settings.enforce_firestore_in_production and settings.environment.lower() == "production" and database_status != "firestore")
            else "degraded"
        ),
        environment=settings.environment,
        database=database_status,
        monitoring="running",
        authMode=auth_mode,
        analytics="bigquery_export" if settings.bigquery_dataset and settings.bigquery_table else "local_audit_log",
    )
    return health_payload.model_dump(by_alias=True)


@app.post("/auth/login")
async def login_endpoint(request: AuthLoginRequest) -> dict:
    response = await login_user(request)
    return response.model_dump(by_alias=True)


@app.post("/auth/firebase")
async def firebase_login_endpoint(request: FirebaseAuthExchangeRequest) -> dict:
    response = await exchange_firebase_login(request.id_token)
    return response.model_dump(by_alias=True)


@app.get("/auth/me")
async def me_endpoint(current_user: AuthUser = Depends(get_current_user)) -> dict:
    return current_user.model_dump(by_alias=True)


@app.get("/users")
async def list_users_endpoint(_: AuthUser = Depends(require_admin)) -> dict:
    return UserListResponse(users=list_users()).model_dump(by_alias=True)


@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(request: UserCreateRequest, _: AuthUser = Depends(require_admin)) -> dict:
    user = await create_user(request)
    return user.model_dump(by_alias=True)


@app.put("/users/{user_id}/password")
async def update_user_password_endpoint(
    user_id: str,
    request: PasswordUpdateRequest,
    _: AuthUser = Depends(require_admin),
) -> dict:
    user = update_user_password(user_id, request)
    return user.model_dump(by_alias=True)


@app.put("/users/{user_id}/device-token")
async def update_user_device_token_endpoint(
    user_id: str,
    request: DeviceTokenUpdateRequest,
    _: AuthUser = Depends(require_admin),
) -> dict:
    user = update_device_token(user_id, request)
    return user.model_dump(by_alias=True)


@app.post("/geocode")
async def geocode_endpoint(request: GeocodeRequest, _: AuthUser = Depends(get_current_user)) -> dict:
    try:
        location = await geocode_location(request.query)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return GeocodeResponse(location=location).model_dump(by_alias=True)


@app.post("/analyze")
async def analyze_endpoint(request: AnalyzeRequest, _: AuthUser = Depends(get_current_user)) -> dict:
    response = await analyze_route_pair(request)
    return response.model_dump(by_alias=True)


@app.get("/shipments")
async def list_shipments_endpoint(current_user: AuthUser = Depends(get_current_user)) -> dict:
    shipments = await list_shipments(current_user)
    return ShipmentListResponse(shipments=shipments).model_dump(by_alias=True)


@app.get("/audit-events")
async def list_audit_events_endpoint(
    shipment_id: str | None = Query(default=None, alias="shipmentId"),
    current_user: AuthUser = Depends(get_current_user),
) -> dict:
    events = await list_operational_events(shipment_id, current_user)
    return AuditTrailResponse(events=events).model_dump(by_alias=True)


@app.get("/shipments/{shipment_id}")
async def get_shipment_endpoint(shipment_id: str, current_user: AuthUser = Depends(get_current_user)) -> dict:
    try:
        shipment = await get_shipment(shipment_id, current_user)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return shipment.model_dump(by_alias=True)


@app.post("/shipments")
async def create_shipment_endpoint(request: ShipmentCreateRequest, current_user: AuthUser = Depends(get_current_user)) -> dict:
    try:
        shipment = await create_shipment(request, current_user)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return shipment.model_dump(by_alias=True)


@app.post("/shipments/{shipment_id}/refresh")
async def refresh_shipment_endpoint(shipment_id: str, current_user: AuthUser = Depends(get_current_user)) -> dict:
    try:
        shipment = await refresh_shipment(shipment_id, current_user=current_user)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return shipment.model_dump(by_alias=True)


@app.patch("/shipments/{shipment_id}")
async def patch_shipment_endpoint(
    shipment_id: str,
    request: ShipmentRouteUpdateRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> dict:
    try:
        shipment = await apply_route(shipment_id, request, current_user)
    except ValueError as error:
        status_code = 404 if "not found" in str(error).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(error)) from error
    return shipment.model_dump(by_alias=True)


@app.post("/shipments/{shipment_id}/route")
async def apply_route_endpoint(
    shipment_id: str,
    request: ShipmentRouteUpdateRequest,
    current_user: AuthUser = Depends(get_current_user),
) -> dict:
    try:
        shipment = await apply_route(shipment_id, request, current_user)
    except ValueError as error:
        status_code = 404 if "not found" in str(error).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(error)) from error
    return shipment.model_dump(by_alias=True)
