from __future__ import annotations

import json
import logging
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except Exception:  # pragma: no cover - optional runtime dependency fallback
    firebase_admin = None
    credentials = None
    firestore = None

from pydantic import ValidationError

from .config import settings
from .logging_config import log_event
from .schemas import AlertRecord, AuditEventRecord, AuthUserRecord, ShipmentRecord

logger = logging.getLogger("clearpath.storage")


class ShipmentStore:
    def __init__(self) -> None:
        self.collection_name = settings.firebase_collection_name
        self.repo_root = Path(__file__).resolve().parents[2]
        self.legacy_path = self._resolve_local_path(settings.shipment_store_path)
        self.legacy_duplicate_path = self._duplicate_legacy_path(settings.shipment_store_path)
        self.alert_path = self._resolve_local_path(settings.alert_store_path)
        self.user_path = self._resolve_local_path(settings.user_store_path)
        self.audit_path = self._resolve_local_path(settings.audit_store_path)
        self.alert_collection_name = settings.firebase_alert_collection_name
        self.user_collection_name = settings.firebase_user_collection_name
        self.audit_collection_name = settings.firebase_audit_collection_name
        self.sqlite_path = self._resolve_sqlite_path(settings.database_url)
        self._client: Any | None = None
        self._migration_checked = False
        self._ensure_local_store_location(self.legacy_path, settings.shipment_store_path)
        self._ensure_local_store_location(self.alert_path, settings.alert_store_path)
        self._ensure_local_store_location(self.user_path, settings.user_store_path)
        self._ensure_local_store_location(self.audit_path, settings.audit_store_path)
        if not self.uses_firestore:
            self._initialize_sqlite()
            self._migrate_legacy_json_to_sqlite()

    def _resolve_local_path(self, configured_path: str) -> Path:
        path = Path(configured_path)
        return path if path.is_absolute() else self.repo_root / path

    def _duplicate_legacy_path(self, configured_path: str) -> Path | None:
        path = Path(configured_path)
        if path.is_absolute():
            return None
        return self.repo_root / "backend" / path

    def _resolve_sqlite_path(self, database_url: str) -> Path:
        prefix = "sqlite:///"
        if not database_url.startswith(prefix):
            raise ValueError("Only sqlite database URLs are currently supported for local persistence.")
        raw_path = database_url[len(prefix) :]
        if raw_path.startswith("/") and len(raw_path) > 2 and raw_path[2] == ":":
            raw_path = raw_path[1:]
        path = Path(raw_path)
        return path if path.is_absolute() else self.repo_root / path

    def _ensure_local_store_location(self, preferred_path: Path, configured_path: str) -> None:
        duplicate_path = self._duplicate_legacy_path(configured_path)
        if preferred_path.exists() or duplicate_path is None or not duplicate_path.exists():
            return
        preferred_path.parent.mkdir(parents=True, exist_ok=True)
        preferred_path.write_text(duplicate_path.read_text(encoding="utf-8"), encoding="utf-8")

    @property
    def uses_firestore(self) -> bool:
        return bool((settings.firebase_project_id or settings.firebase_credentials_path) and firebase_admin and firestore)

    def _initialize_firestore(self):
        if self._client is not None:
            return self._client

        if not self.uses_firestore:
            raise RuntimeError("Firestore is not configured.")

        if not firebase_admin._apps:
            app_options = {"projectId": settings.firebase_project_id} if settings.firebase_project_id else None
            if settings.firebase_credentials_path:
                credential = credentials.Certificate(settings.firebase_credentials_path)
                firebase_admin.initialize_app(credential, options=app_options)
            else:
                firebase_admin.initialize_app(options=app_options)

        self._client = firestore.client()
        self._migrate_legacy_shipments_to_firestore()
        return self._client

    def _shipment_collection(self):
        return self._initialize_firestore().collection(self.collection_name)

    def _alert_collection(self):
        return self._initialize_firestore().collection(self.alert_collection_name)

    def _user_collection(self):
        return self._initialize_firestore().collection(self.user_collection_name)

    def _audit_collection(self):
        return self._initialize_firestore().collection(self.audit_collection_name)

    def _read_json_records(self, path: Path) -> list[dict[str, Any]]:
        if not path.exists():
            return []
        return json.loads(path.read_text(encoding="utf-8") or "[]")

    def _initialize_sqlite(self) -> None:
        self.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        with self._sqlite_connection() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS shipments (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    payload TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments (created_at DESC);

                CREATE TABLE IF NOT EXISTS alerts (
                    id TEXT PRIMARY KEY,
                    shipment_id TEXT,
                    created_at TEXT NOT NULL,
                    payload TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_alerts_shipment_id ON alerts (shipment_id);
                CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts (created_at DESC);

                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL,
                    payload TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

                CREATE TABLE IF NOT EXISTS audit_events (
                    id TEXT PRIMARY KEY,
                    shipment_id TEXT,
                    event_type TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    payload TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_audit_events_shipment_id ON audit_events (shipment_id);
                CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events (created_at DESC);
                """
            )

    @contextmanager
    def _sqlite_connection(self):
        connection = sqlite3.connect(self.sqlite_path, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA synchronous = NORMAL")
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def _sqlite_table_has_rows(self, table_name: str) -> bool:
        with self._sqlite_connection() as connection:
            row = connection.execute(f"SELECT COUNT(1) AS total FROM {table_name}").fetchone()
            return bool(row and row["total"])

    def _upsert_sqlite_record(
        self,
        *,
        table_name: str,
        record_id: str,
        payload: dict[str, Any],
        created_at: str,
        updated_at: str | None = None,
        shipment_id: str | None = None,
        username: str | None = None,
        event_type: str | None = None,
    ) -> None:
        json_payload = json.dumps(payload, ensure_ascii=False)
        with self._sqlite_connection() as connection:
            if table_name == "shipments":
                connection.execute(
                    """
                    INSERT INTO shipments (id, created_at, updated_at, payload)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        created_at = excluded.created_at,
                        updated_at = excluded.updated_at,
                        payload = excluded.payload
                    """,
                    (record_id, created_at, updated_at or created_at, json_payload),
                )
            elif table_name == "alerts":
                connection.execute(
                    """
                    INSERT INTO alerts (id, shipment_id, created_at, payload)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        shipment_id = excluded.shipment_id,
                        created_at = excluded.created_at,
                        payload = excluded.payload
                    """,
                    (record_id, shipment_id, created_at, json_payload),
                )
            elif table_name == "users":
                connection.execute(
                    """
                    INSERT INTO users (id, username, created_at, payload)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        username = excluded.username,
                        created_at = excluded.created_at,
                        payload = excluded.payload
                    """,
                    (record_id, username, created_at, json_payload),
                )
            elif table_name == "audit_events":
                connection.execute(
                    """
                    INSERT INTO audit_events (id, shipment_id, event_type, created_at, payload)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        shipment_id = excluded.shipment_id,
                        event_type = excluded.event_type,
                        created_at = excluded.created_at,
                        payload = excluded.payload
                    """,
                    (record_id, shipment_id, event_type or "unknown", created_at, json_payload),
                )

    def _migrate_legacy_shipments_to_firestore(self) -> None:
        if self._migration_checked:
            return

        self._migration_checked = True
        if not self.legacy_path.exists():
            return

        snapshots = list(self._shipment_collection().limit(1).stream())
        if snapshots:
            return

        payload = json.loads(self.legacy_path.read_text(encoding="utf-8") or "[]")
        records = [ShipmentRecord.model_validate(item) for item in payload]
        if not records:
            return

        batch = self._initialize_firestore().batch()
        for record in records:
            batch.set(self._shipment_collection().document(record.id), record.model_dump(by_alias=True))
        batch.commit()

    def _migrate_legacy_json_to_sqlite(self) -> None:
        if self._migration_checked:
            return
        self._migration_checked = True

        if not self._sqlite_table_has_rows("shipments"):
            for shipment in self._load_legacy_shipments():
                self.save_shipment(shipment)
        if not self._sqlite_table_has_rows("alerts"):
            for alert in self._load_legacy_records(self.alert_path, AlertRecord):
                self.save_alert(alert)
        if not self._sqlite_table_has_rows("users"):
            for user in self._load_legacy_records(self.user_path, AuthUserRecord):
                self.save_user(user)
        if not self._sqlite_table_has_rows("audit_events"):
            for event in self._load_legacy_records(self.audit_path, AuditEventRecord):
                self.save_audit_event(event)

    def _load_legacy_records(self, path: Path, schema: type) -> list[Any]:
        records: list[Any] = []
        for item in self._read_json_records(path):
            try:
                records.append(schema.model_validate(item))
            except ValidationError:
                log_event(logger, logging.WARNING, "Skipping invalid legacy record during migration", recordType=schema.__name__, recordId=item.get("id"))
        return records

    def _load_legacy_shipments(self) -> list[ShipmentRecord]:
        shipments = self._load_legacy_records(self.legacy_path, ShipmentRecord)
        if shipments:
            return shipments
        if self.legacy_duplicate_path and self.legacy_duplicate_path.exists():
            return self._load_legacy_records(self.legacy_duplicate_path, ShipmentRecord)
        return []

    def list_shipments(self) -> list[ShipmentRecord]:
        if self.uses_firestore:
            snapshots = self._shipment_collection().stream()
            shipments = [ShipmentRecord.model_validate(snapshot.to_dict()) for snapshot in snapshots]
            return sorted(shipments, key=lambda shipment: shipment.created_at, reverse=True)

        with self._sqlite_connection() as connection:
            rows = connection.execute("SELECT payload FROM shipments ORDER BY created_at DESC").fetchall()
        return [ShipmentRecord.model_validate(json.loads(row["payload"])) for row in rows]

    def get_shipment(self, shipment_id: str) -> ShipmentRecord | None:
        if self.uses_firestore:
            snapshot = self._shipment_collection().document(shipment_id).get()
            if not snapshot.exists:
                return None
            return ShipmentRecord.model_validate(snapshot.to_dict())

        with self._sqlite_connection() as connection:
            row = connection.execute("SELECT payload FROM shipments WHERE id = ?", (shipment_id,)).fetchone()
        return ShipmentRecord.model_validate(json.loads(row["payload"])) if row else None

    def save_shipment(self, shipment: ShipmentRecord) -> ShipmentRecord:
        payload = shipment.model_dump(by_alias=True)
        if self.uses_firestore:
            self._shipment_collection().document(shipment.id).set(payload)
            return shipment

        self._upsert_sqlite_record(
            table_name="shipments",
            record_id=shipment.id,
            payload=payload,
            created_at=shipment.created_at,
            updated_at=shipment.updated_at,
        )
        return shipment

    def list_alerts(self, shipment_id: str | None = None) -> list[AlertRecord]:
        if self.uses_firestore:
            snapshots = self._alert_collection().stream()
            alerts = [AlertRecord.model_validate(snapshot.to_dict()) for snapshot in snapshots]
        else:
            query = "SELECT payload FROM alerts"
            params: tuple[Any, ...] = ()
            if shipment_id is not None:
                query += " WHERE shipment_id = ?"
                params = (shipment_id,)
            query += " ORDER BY created_at DESC"
            with self._sqlite_connection() as connection:
                rows = connection.execute(query, params).fetchall()
            alerts = [AlertRecord.model_validate(json.loads(row["payload"])) for row in rows]

        if shipment_id is not None and self.uses_firestore:
            alerts = [alert for alert in alerts if alert.shipment_id == shipment_id]
        return sorted(alerts, key=lambda alert: alert.created_at, reverse=True)

    def save_alert(self, alert: AlertRecord) -> AlertRecord:
        payload = alert.model_dump(by_alias=True)
        if self.uses_firestore:
            self._alert_collection().document(alert.id).set(payload)
            return alert

        self._upsert_sqlite_record(
            table_name="alerts",
            record_id=alert.id,
            payload=payload,
            created_at=alert.created_at,
            shipment_id=alert.shipment_id,
        )
        return alert

    def list_audit_events(self, shipment_id: str | None = None) -> list[AuditEventRecord]:
        if self.uses_firestore:
            snapshots = self._audit_collection().stream()
            events = [AuditEventRecord.model_validate(snapshot.to_dict()) for snapshot in snapshots]
        else:
            query = "SELECT payload FROM audit_events"
            params: tuple[Any, ...] = ()
            if shipment_id is not None:
                query += " WHERE shipment_id = ?"
                params = (shipment_id,)
            query += " ORDER BY created_at DESC"
            with self._sqlite_connection() as connection:
                rows = connection.execute(query, params).fetchall()
            events = [AuditEventRecord.model_validate(json.loads(row["payload"])) for row in rows]

        if shipment_id is not None and self.uses_firestore:
            events = [event for event in events if event.shipment_id == shipment_id]
        return sorted(events, key=lambda event: event.created_at, reverse=True)

    def save_audit_event(self, event: AuditEventRecord) -> AuditEventRecord:
        payload = event.model_dump(by_alias=True)
        if self.uses_firestore:
            self._audit_collection().document(event.id).set(payload)
            return event

        self._upsert_sqlite_record(
            table_name="audit_events",
            record_id=event.id,
            payload=payload,
            created_at=event.created_at,
            shipment_id=event.shipment_id,
            event_type=event.event_type,
        )
        return event

    def get_user_by_username(self, username: str) -> AuthUserRecord | None:
        normalized = username.strip().lower()
        if self.uses_firestore:
            snapshots = list(self._user_collection().where("username", "==", normalized).limit(1).stream())
            if not snapshots:
                return None
            return AuthUserRecord.model_validate(snapshots[0].to_dict())

        with self._sqlite_connection() as connection:
            row = connection.execute("SELECT payload FROM users WHERE username = ?", (normalized,)).fetchone()
        return AuthUserRecord.model_validate(json.loads(row["payload"])) if row else None

    def get_user_by_id(self, user_id: str) -> AuthUserRecord | None:
        if self.uses_firestore:
            snapshot = self._user_collection().document(user_id).get()
            if not snapshot.exists:
                return None
            return AuthUserRecord.model_validate(snapshot.to_dict())

        with self._sqlite_connection() as connection:
            row = connection.execute("SELECT payload FROM users WHERE id = ?", (user_id,)).fetchone()
        return AuthUserRecord.model_validate(json.loads(row["payload"])) if row else None

    def list_users(self) -> list[AuthUserRecord]:
        if self.uses_firestore:
            snapshots = self._user_collection().stream()
            users = [AuthUserRecord.model_validate(snapshot.to_dict()) for snapshot in snapshots]
            return sorted(users, key=lambda user: user.created_at, reverse=True)

        with self._sqlite_connection() as connection:
            rows = connection.execute("SELECT payload FROM users ORDER BY created_at DESC").fetchall()
        return [AuthUserRecord.model_validate(json.loads(row["payload"])) for row in rows]

    def save_user(self, user: AuthUserRecord) -> AuthUserRecord:
        payload = user.model_dump(by_alias=True)
        if self.uses_firestore:
            self._user_collection().document(user.id).set(payload)
            return user

        self._upsert_sqlite_record(
            table_name="users",
            record_id=user.id,
            payload=payload,
            created_at=user.created_at,
            username=user.username,
        )
        return user

    def health_summary(self) -> str:
        return "firestore" if self.uses_firestore else "sqlite"


shipment_store = ShipmentStore()
