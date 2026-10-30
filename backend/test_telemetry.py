import unittest

from backend.telemetry import validate_readings


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


if __name__ == "__main__":
    unittest.main()
