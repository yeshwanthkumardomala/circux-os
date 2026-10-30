"""Safe, local Arduino CLI access. Commands are fixed and never invoke a shell."""
import json
import os
import re
import shutil
import subprocess
import threading
from pathlib import Path
from typing import Any

FQBN = re.compile(r"^[A-Za-z0-9_.:-]{1,160}$")
_CLI_LOCK = threading.Lock()


class ArduinoUnavailable(RuntimeError):
    pass


def run_cli(*args: str, timeout: int = 15) -> subprocess.CompletedProcess[str]:
    if not _CLI_LOCK.acquire(blocking=False):
        raise RuntimeError("Another Arduino CLI operation is already running")
    try:
        executable = shutil.which("arduino-cli")
        if not executable:
            raise ArduinoUnavailable("arduino-cli is not installed or is not on PATH")
        try:
            result = subprocess.run([executable, *args], capture_output=True, text=True, timeout=timeout, check=False)
        except subprocess.TimeoutExpired as error:
            raise TimeoutError("arduino-cli command timed out") from error
        if result.returncode:
            raise RuntimeError((result.stderr or result.stdout or "arduino-cli failed")[-4000:])
        return result
    finally:
        _CLI_LOCK.release()


def detected_ports() -> list[dict[str, Any]]:
    result = run_cli("board", "list", "--format", "json")
    payload = json.loads(result.stdout or "{}")
    ports = []
    for item in payload.get("detected_ports", []):
        port = item.get("port", {})
        address = port.get("address")
        if address:
            ports.append({
                "address": address,
                "label": port.get("label", address),
                "boards": item.get("matching_boards", []),
            })
    return ports


def sketch_directory(name: str) -> Path:
    if not name or name in {".", ".."} or "/" in name or "\\" in name:
        raise ValueError("Sketch must be a direct child folder name")
    root = Path(os.getenv("CIRCUX_SKETCH_DIR", "sketches")).resolve()
    folder = (root / name).resolve()
    if not folder.is_relative_to(root) or not folder.is_dir():
        raise ValueError("Sketch folder is outside the configured sketch directory or does not exist")
    if not any(folder.glob("*.ino")):
        raise ValueError("Sketch folder must contain an .ino file")
    return folder


def validate_fqbn(fqbn: str) -> str:
    if not FQBN.fullmatch(fqbn):
        raise ValueError("Invalid Arduino FQBN")
    return fqbn


def compile_sketch(name: str, fqbn: str) -> dict[str, Any]:
    folder = sketch_directory(name)
    result = run_cli("compile", "--fqbn", validate_fqbn(fqbn), str(folder), timeout=180)
    return {"ok": True, "sketch": name, "fqbn": fqbn, "output": (result.stdout or "")[-4000:]}


def upload_sketch(name: str, fqbn: str, port: str) -> dict[str, Any]:
    if port not in {item["address"] for item in detected_ports()}:
        raise ValueError("Selected serial port is not currently detected by Arduino CLI")
    folder = sketch_directory(name)
    result = run_cli("upload", "-p", port, "--fqbn", validate_fqbn(fqbn), str(folder), timeout=180)
    return {"ok": True, "sketch": name, "fqbn": fqbn, "port": port, "output": (result.stdout or "")[-4000:]}
