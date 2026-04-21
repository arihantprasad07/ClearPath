from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ClearPath FastAPI"
    environment: str = "development"
    port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"
    log_level: str = "INFO"
    weather_api_key: str | None = None
    weather_base_url: str = "https://api.openweathermap.org/data/2.5/weather"
    google_maps_api_key: str | None = None
    google_routes_url: str = "https://routes.googleapis.com/directions/v2:computeRoutes"
    google_geocoding_url: str = "https://maps.googleapis.com/maps/api/geocode/json"
    gemini_api_key: str | None = None
    google_translate_api_key: str | None = None
    vertex_ai_project_id: str | None = None
    vertex_ai_location: str = "asia-south1"
    vertex_ai_model: str = "gemini-2.0-flash"
    gemini_model: str = "gemini-2.0-flash"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/models"
    request_timeout_seconds: float = Field(default=2.0, ge=0.5, le=10.0)
    request_retry_attempts: int = Field(default=2, ge=0, le=5)
    route_cache_ttl_seconds: int = Field(default=30, ge=30, le=900)
    weather_cache_ttl_seconds: int = Field(default=30, ge=30, le=1800)
    database_url: str = "sqlite:///backend/data/clearpath.db"
    shipment_store_path: str = "backend/data/shipments.json"
    alert_store_path: str = "backend/data/alerts.json"
    user_store_path: str = "backend/data/users.json"
    audit_store_path: str = "backend/data/audit_events.json"
    firebase_project_id: str | None = None
    firebase_credentials_path: str | None = None
    firebase_auth_enabled: bool = False
    auth_mode: str = "app_jwt"
    allow_password_login: bool = True
    require_admin_mfa: bool = False
    enforce_firestore_in_production: bool = False
    firebase_functions_enabled: bool = False
    firebase_functions_base_url: str | None = None
    firebase_collection_name: str = "shipments"
    firebase_alert_collection_name: str = "alerts"
    firebase_user_collection_name: str = "users"
    firebase_audit_collection_name: str = "audit_events"
    bigquery_project_id: str | None = None
    bigquery_dataset: str | None = None
    bigquery_table: str | None = None
    fcm_server_key: str | None = None
    fcm_project_id: str | None = None
    fcm_demo_token: str | None = None
    port_feeds_base_url: str | None = None
    nhai_roads_base_url: str | None = None
    monitoring_interval_seconds: int = Field(default=15, ge=5, le=3600)
    risk_alert_threshold: int = Field(default=70, ge=1, le=100)
    # REQUIRED: Set in .env - no default is baked into the app.
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=720, ge=15, le=10080)
    admin_username: str = "admin"
    # REQUIRED: Set in .env - no default is baked into the app.
    admin_password: str = ""
    whatsapp_token: str | None = None
    whatsapp_phone_number_id: str | None = None
    whatsapp_demo_recipient: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("jwt_secret_key", "admin_password")
    @classmethod
    def validate_required_secret(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("must be set in .env or the environment.")
        return value.strip()

    @field_validator("auth_mode")
    @classmethod
    def validate_auth_mode(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"app_jwt", "firebase_bridge", "firebase_primary"}:
            raise ValueError("AUTH_MODE must be one of: app_jwt, firebase_bridge, firebase_primary.")
        return normalized

    @model_validator(mode="after")
    def validate_runtime_dependencies(self):
        if self.auth_mode in {"firebase_bridge", "firebase_primary"} and not self.firebase_auth_enabled:
            raise ValueError("FIREBASE_AUTH_ENABLED must be true when AUTH_MODE uses Firebase.")
        if self.auth_mode == "firebase_primary" and self.environment.lower() == "production" and not self.firebase_project_id:
            raise ValueError("FIREBASE_PROJECT_ID must be configured for firebase_primary mode in production.")
        if self.enforce_firestore_in_production and self.environment.lower() == "production" and not self.firebase_project_id:
            raise ValueError("FIREBASE_PROJECT_ID must be configured when ENFORCE_FIRESTORE_IN_PRODUCTION is enabled.")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
