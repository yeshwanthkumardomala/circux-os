import unittest

from backend.telemetry import admin_token_from_subprotocols, validate_readings, validate_sensor_metadata


class TelemetryValidationTests(unittest.TestCase):
    def test_accepts_sensor_values_and_short_rfid_text(self):
        readings = [{"label": "Temperature", "value": 23.5, "unit": "C"}, {"label": "RFID tag", "value": "04A17F"}]
        self.assertEqual(validate_readings(readings), readings)

    def test_rejects_non_finite_numeric_values_and_bad_shapes(self):
        for value in ([{"label": "x", "value": float("nan")}], [{"label": "x", "value": True}], [{"label": "", "value": 1}], ["bad"]):
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_readings(value)

    def test_caps_size_and_text_fields(self):
        with self.assertRaises(ValueError):
            validate_readings([{"label": "x", "value": 1}] * 33)
        with self.assertRaises(ValueError):
            validate_readings([{"label": "x", "value": "x" * 161}])

    def test_validates_optional_temperature_and_voltage_metadata(self):
        self.assertEqual(validate_sensor_metadata({"board_temperature": 31.2, "voltage": 5}), {"board_temperature": 31.2, "voltage": 5})
        self.assertEqual(validate_sensor_metadata({"readings": []}), {})
        for payload in ({"voltage": -1}, {"board_temperature": 251}, {"voltage": float("nan")}, {"voltage": True}):
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                validate_sensor_metadata(payload)

    def test_extracts_websocket_token_only_from_offered_subprotocols(self):
        self.assertEqual(admin_token_from_subprotocols(["circux-admin", "circux-admin-token.secret"]), "secret")
        self.assertEqual(admin_token_from_subprotocols([]), "")
        self.assertEqual(admin_token_from_subprotocols(["token.secret"]), "")

    def test_large_integer_reading_is_rejected_without_overflow(self):
        with self.assertRaises(ValueError):
            validate_readings([{"label": "x", "value": 10**1000}])


if __name__ == "__main__":
    unittest.main()
