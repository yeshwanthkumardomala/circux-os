"""Focused regression tests for backend authorization and board token rotation."""
import os
import tempfile
import unittest
import uuid
from types import SimpleNamespace

_TEST_DATA_DIR = tempfile.mkdtemp(prefix="circux-backend-tests-")
os.environ["CIRCUX_DATA_DIR"] = _TEST_DATA_DIR
os.environ["CIRCUX_ADMIN_TOKEN"] = "test-admin-token"

from fastapi import HTTPException  # noqa: E402
from backend.app import main  # noqa: E402


class BackendSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        main.init_db()

    def test_admin_token_is_required_and_compared(self):
        self.assertEqual(main.require_admin("Bearer test-admin-token"), "admin")
        with self.assertRaises(HTTPException) as missing:
            main.require_admin(None)
        self.assertEqual(missing.exception.status_code, 401)
        with self.assertRaises(HTTPException) as invalid:
            main.require_admin("Bearer wrong-token")
        self.assertEqual(invalid.exception.status_code, 401)

    def test_board_reregistration_rotates_device_token(self):
        board_id = "test-" + uuid.uuid4().hex[:12]
        first = main.register_board(
            main.BoardInput(id=board_id, name="Test board", token="first-device-token"),
            actor="admin",
        )
        self.assertEqual(main.board_from_token(board_id, "first-device-token")["id"], board_id)

        second = main.register_board(
            main.BoardInput(id=board_id, name="Test board", token="second-device-token"),
            actor="admin",
        )
        self.assertEqual(second["token"], "second-device-token")
        self.assertEqual(main.board_from_token(board_id, "second-device-token")["id"], board_id)
        with self.assertRaises(HTTPException) as revoked:
            main.board_from_token(board_id, "first-device-token")
        self.assertEqual(revoked.exception.status_code, 401)

    def test_hardware_upload_is_rate_limited_per_client(self):
        main._HARDWARE_REQUESTS.clear()
        request = SimpleNamespace(client=SimpleNamespace(host="127.0.0.1"))
        main.enforce_hardware_rate_limit(request, "upload")
        main.enforce_hardware_rate_limit(request, "upload")
        with self.assertRaises(HTTPException) as limited:
            main.enforce_hardware_rate_limit(request, "upload")
        self.assertEqual(limited.exception.status_code, 429)

    def test_readiness_checks_local_database(self):
        self.assertEqual(main.readiness(), {"ready": True, "database": "ok"})

    def test_verified_reading_is_saved_with_board_timestamp(self):
        board_id = "reading-" + uuid.uuid4().hex[:10]
        main.register_board(main.BoardInput(id=board_id, name="Sensor board", token="sensor-token"), actor="admin")
        result = main.readings(board_id, {"readings": [{"label": "Temperature", "value": 24.5, "unit": "C"}], "board_temperature": 31.2, "voltage": 5}, "sensor-token")
        self.assertEqual(result["board_temperature"], 31.2)
        self.assertEqual(result["readings"][0]["value"], 24.5)
        self.assertGreater(result["received_at"], 0)
        with self.assertRaises(HTTPException) as invalid:
            main.readings(board_id, {"readings": [], "voltage": -1}, "sensor-token")
        self.assertEqual(invalid.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
