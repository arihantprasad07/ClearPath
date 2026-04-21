from __future__ import annotations

import os
import sqlite3
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4


BACKEND_ROOT = Path(__file__).resolve().parents[1]
TEST_RUNTIME_DIR = BACKEND_ROOT.parent / ".tmp" / "backend-tests"
TEST_DB_PATH = TEST_RUNTIME_DIR / "test_suite.db"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
TEST_RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
if TEST_DB_PATH.exists():
    TEST_DB_PATH.unlink()

os.environ["ENVIRONMENT"] = "test"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"
os.environ["ADMIN_USERNAME"] = "admin"
os.environ["ADMIN_PASSWORD"] = "Admin1234"
os.environ["DATABASE_URL"] = "sqlite:///./.tmp/backend-tests/test_suite.db"
os.environ["SHIPMENT_STORE_PATH"] = ".tmp/backend-tests/shipments.json"
os.environ["ALERT_STORE_PATH"] = ".tmp/backend-tests/alerts.json"
os.environ["USER_STORE_PATH"] = ".tmp/backend-tests/users.json"
os.environ["AUDIT_STORE_PATH"] = ".tmp/backend-tests/audit_events.json"
os.environ["FIREBASE_PROJECT_ID"] = ""
os.environ["FIREBASE_CREDENTIALS_PATH"] = ""
os.environ["FIREBASE_AUTH_ENABLED"] = "false"
os.environ["BIGQUERY_PROJECT_ID"] = ""
os.environ["BIGQUERY_DATASET"] = ""
os.environ["BIGQUERY_TABLE"] = ""

from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.schemas import AuthUser
from app.storage import shipment_store


class ClearPathApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self._reset_database()

    def _reset_database(self) -> None:
        connection = sqlite3.connect(TEST_DB_PATH)
        try:
            connection.execute("DELETE FROM audit_events")
            connection.execute("DELETE FROM alerts")
            connection.execute("DELETE FROM shipments")
            connection.execute("DELETE FROM users")
            connection.commit()
        finally:
            connection.close()
        from app.auth_service import ensure_admin_user

        ensure_admin_user()

    def _login(self, client: TestClient, username: str, password: str) -> str:
        response = client.post("/auth/login", json={"username": username, "password": password})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["accessToken"]

    def test_health_includes_security_headers(self) -> None:
        with TestClient(app) as client:
            response = client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["database"], "sqlite")
        self.assertIn("X-Request-ID", response.headers)
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(response.headers["X-Frame-Options"], "DENY")

    def test_admin_can_manage_users_and_passwords(self) -> None:
        username = f"operator_{uuid4().hex[:8]}"
        with TestClient(app) as client:
            admin_token = self._login(client, "admin", "Admin1234")
            headers = {"Authorization": f"Bearer {admin_token}"}

            create_response = client.post(
                "/users",
                headers=headers,
                json={
                    "username": username,
                    "password": "Operator123",
                    "role": "operator",
                    "stakeholderRole": "transporter",
                    "orgId": "org-alpha",
                },
            )
            self.assertEqual(create_response.status_code, 201, create_response.text)
            user_id = create_response.json()["id"]
            self.assertEqual(create_response.json()["orgId"], "org-alpha")
            self.assertEqual(create_response.json()["stakeholderRole"], "transporter")

            list_response = client.get("/users", headers=headers)
            self.assertEqual(list_response.status_code, 200)
            self.assertTrue(any(user["username"] == username for user in list_response.json()["users"]))

            password_response = client.put(
                f"/users/{user_id}/password",
                headers=headers,
                json={"password": "Updated123A"},
            )
            self.assertEqual(password_response.status_code, 200, password_response.text)

            token_response = client.put(
                f"/users/{user_id}/device-token",
                headers=headers,
                json={"deviceToken": "device-token-abcdefghijklmnopqrstuvwxyz"},
            )
            self.assertEqual(token_response.status_code, 200, token_response.text)
            self.assertEqual(token_response.json()["deviceToken"], "device-token-abcdefghijklmnopqrstuvwxyz")

            user_token = self._login(client, username, "Updated123A")
            self.assertTrue(user_token)

    def test_shipment_flow_works_with_authenticated_user(self) -> None:
        with TestClient(app) as client:
            token = self._login(client, "admin", "Admin1234")
            headers = {"Authorization": f"Bearer {token}"}

            create_response = client.post(
                "/shipments",
                headers=headers,
                json={"sourceQuery": "Surat", "destinationQuery": "Ahmedabad"},
            )
            self.assertEqual(create_response.status_code, 200, create_response.text)
            shipment_id = create_response.json()["id"]

            list_response = client.get("/shipments", headers=headers)
            self.assertEqual(list_response.status_code, 200)
            self.assertTrue(any(item["id"] == shipment_id for item in list_response.json()["shipments"]))

            refresh_response = client.post(f"/shipments/{shipment_id}/refresh", headers=headers)
            self.assertEqual(refresh_response.status_code, 200, refresh_response.text)

            route_id = refresh_response.json()["recommendedRouteId"]
            approve_response = client.post(
                f"/shipments/{shipment_id}/route",
                headers=headers,
                json={"routeId": route_id},
            )
            self.assertEqual(approve_response.status_code, 200, approve_response.text)
            self.assertEqual(approve_response.json()["activeRouteId"], route_id)

    def test_org_scoping_hides_shipments_from_other_orgs(self) -> None:
        operator_name = f"org_user_{uuid4().hex[:8]}"
        with TestClient(app) as client:
            admin_token = self._login(client, "admin", "Admin1234")
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            create_user_response = client.post(
                "/users",
                headers=admin_headers,
                json={
                    "username": operator_name,
                    "password": "Operator123",
                    "role": "operator",
                    "stakeholderRole": "shipper",
                    "orgId": "org-beta",
                },
            )
            self.assertEqual(create_user_response.status_code, 201, create_user_response.text)

            shipment_response = client.post(
                "/shipments",
                headers=admin_headers,
                json={"sourceQuery": "Mumbai", "destinationQuery": "Pune"},
            )
            self.assertEqual(shipment_response.status_code, 200, shipment_response.text)

            user_token = self._login(client, operator_name, "Operator123")
            user_headers = {"Authorization": f"Bearer {user_token}"}
            list_response = client.get("/shipments", headers=user_headers)
            self.assertEqual(list_response.status_code, 200)
            self.assertEqual(list_response.json()["shipments"], [])

    def test_firebase_primary_accepts_backend_jwt_after_exchange(self) -> None:
        firebase_token = "firebase-demo-token-12345"
        firebase_user = AuthUser(
            id="firebase-user-1",
            username="firebase.user@clearpath.local",
            role="operator",
            stakeholderRole="shipper",
            orgId="org-firebase",
            phoneNumber=None,
            deviceToken=None,
            firebaseUid="firebase-user-1",
            mfaEnabled=False,
            createdAt="2026-04-01T00:00:00+00:00",
        )
        original_auth_mode = settings.auth_mode
        settings.auth_mode = "firebase_primary"

        async def fake_verify(token: str):
            if token == firebase_token:
                return firebase_user
            return None

        try:
            with patch("app.auth_service.verify_firebase_bearer_token", side_effect=fake_verify), patch(
                "app.dependencies.verify_firebase_bearer_token",
                side_effect=fake_verify,
            ):
                with TestClient(app) as client:
                    exchange_response = client.post("/auth/firebase", json={"idToken": firebase_token})
                    self.assertEqual(exchange_response.status_code, 200, exchange_response.text)

                    access_token = exchange_response.json()["accessToken"]
                    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})
                    self.assertEqual(me_response.status_code, 200, me_response.text)
                    self.assertEqual(me_response.json()["id"], firebase_user.id)
                    self.assertEqual(me_response.json()["orgId"], firebase_user.org_id)
        finally:
            settings.auth_mode = original_auth_mode


if __name__ == "__main__":
    unittest.main()
