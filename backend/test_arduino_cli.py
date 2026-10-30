import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from backend import arduino_cli


class ArduinoCliTests(unittest.TestCase):
    def test_sketch_path_rejects_traversal_and_requires_ino(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {"CIRCUX_SKETCH_DIR": directory}):
            with self.assertRaises(ValueError):
                arduino_cli.sketch_directory("../outside")
            empty = Path(directory) / "empty"
            empty.mkdir()
            with self.assertRaises(ValueError):
                arduino_cli.sketch_directory("empty")

    def test_compile_uses_fixed_argument_list_and_never_shell(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {"CIRCUX_SKETCH_DIR": directory}):
            sketch = Path(directory) / "testsketch"
            sketch.mkdir()
            (sketch / "testsketch.ino").write_text("void setup() {}", encoding="utf-8")
            completed = arduino_cli.subprocess.CompletedProcess([], 0, "compiled", "")
            with patch.object(arduino_cli.shutil, "which", return_value="arduino-cli"), patch.object(arduino_cli.subprocess, "run", return_value=completed) as run:
                result = arduino_cli.compile_sketch("testsketch", "arduino:avr:uno")
            self.assertTrue(result["ok"])
            self.assertEqual(run.call_args.args[0][:4], ["arduino-cli", "compile", "--fqbn", "arduino:avr:uno"])
            self.assertFalse(run.call_args.kwargs.get("shell", False))

    def test_detected_ports_are_parsed_from_cli_json(self):
        output = json.dumps({"detected_ports": [{"port": {"address": "COM9", "label": "USB"}, "matching_boards": [{"fqbn": "arduino:avr:uno"}]}]})
        with patch.object(arduino_cli, "run_cli", return_value=arduino_cli.subprocess.CompletedProcess([], 0, output, "")):
            self.assertEqual(arduino_cli.detected_ports()[0]["address"], "COM9")

    def test_upload_rejects_unverified_port(self):
        with patch.object(arduino_cli, "detected_ports", return_value=[]):
            with self.assertRaisesRegex(ValueError, "not currently detected"):
                arduino_cli.upload_sketch("test", "arduino:avr:uno", "COM9")

    def test_cli_rejects_overlapping_commands(self):
        arduino_cli._CLI_LOCK.acquire()
        try:
            with self.assertRaisesRegex(RuntimeError, "already running"):
                arduino_cli.run_cli("version")
        finally:
            arduino_cli._CLI_LOCK.release()


if __name__ == "__main__":
    unittest.main()
