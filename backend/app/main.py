import hashlib
import json
import os
import secrets
import sqlite3
import time
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

DATA_DIR = Path(os.getenv("CIRCUX_DATA_DIR", ".circux-data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "circux.db"
ADMIN_TOKEN = os.getenv("CIRCUX_ADMIN_TOKEN", "")
MAX_UPLOAD = 10 * 1024 * 1024

app = FastAPI(title="Circux Local API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CIRCUX_ALLOWED_ORIGIN", "http://localhost:3000").split(","), allow_credentials=False, allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Authorization", "Content-Type", "X-Device-Token"])


def db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA foreign_keys=ON")
    return connection


def init_db() -> None:
    with db() as connection:
        connection.executescript("""
        CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS boards (id TEXT PRIMARY KEY, project_id TEXT, token_hash TEXT NOT NULL, data TEXT NOT NULL, updated_at REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS readings (id INTEGER PRIMARY KEY AUTOINCREMENT, board_id TEXT NOT NULL, data TEXT NOT NULL, created_at REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, actor TEXT NOT NULL, data TEXT NOT NULL, created_at REAL NOT NULL);
        """)


@app.on_event("startup")
def startup() -> None:
    init_db()
    if not ADMIN_TOKEN:
        print("CIRCUX_ADMIN_TOKEN is not set; write endpoints are disabled until it is configured.")


def require_admin(authorization: str | None = Header(default=None)) -> str:
    if not ADMIN_TOKEN or not secrets.compare_digest(authorization or "", f"Bearer {ADMIN_TOKEN}"):
        raise HTTPException(401, "Admin authentication required")
    return "admin"


def board_from_token(board_id: str, token: str | None) -> sqlite3.Row:
    if not token:
        raise HTTPException(401, "Device token required")
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with db() as connection:
        board = connection.execute("SELECT * FROM boards WHERE id=? AND token_hash=?", (board_id, token_hash)).fetchone()
    if not board:
        raise HTTPException(401, "Invalid device token")
    return board


def audit(action: str, actor: str, data: Any = None) -> None:
    with db() as connection:
        connection.execute("INSERT INTO audit(action, actor, data, created_at) VALUES(?,?,?,?)", (action, actor, json.dumps(data or {}), time.time()))


class ProjectInput(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=200)
    project: dict[str, Any] = Field(default_factory=dict)


class BoardInput(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    project_id: str | None = None
    name: str = Field(min_length=1, max_length=120)
    token: str | None = None
    sampling_interval_ms: int = Field(default=2000, ge=250, le=60000)
    temperature_limit: float = Field(default=60, ge=20, le=100)


class ConfigInput(BaseModel):
    values: dict[str, Any]


class FallbackInput(BaseModel):
    reason: str = Field(min_length=1, max_length=500)
    mode: str = Field(default="last-trusted", pattern="^(last-trusted|simulated)$")


@app.get("/api/health")
def health() -> dict[str, Any]:
    with db() as connection:
        boards = connection.execute("SELECT COUNT(*) AS count FROM boards").fetchone()["count"]
    return {"ok": True, "service": "circux-fastapi", "boards": boards}


@app.get("/api/config")
def get_config(actor: str = Depends(require_admin)) -> dict[str, Any]:
    with db() as connection:
        rows = connection.execute("SELECT key, value FROM config").fetchall()
    return {row["key"]: json.loads(row["value"]) for row in rows}


@app.put("/api/config")
def put_config(input: ConfigInput, actor: str = Depends(require_admin)) -> dict[str, Any]:
    with db() as connection:
        for key, value in input.values.items():
            connection.execute("INSERT INTO config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, json.dumps(value)))
    audit("config.updated", actor, input.values)
    return get_config()


@app.get("/api/projects")
def list_projects() -> list[dict[str, Any]]:
    with db() as connection:
        rows = connection.execute("SELECT data FROM projects ORDER BY updated_at DESC").fetchall()
    return [json.loads(row["data"]) for row in rows]


@app.get("/api/projects/{project_id}")
def get_project(project_id: str) -> dict[str, Any]:
    with db() as connection:
        row = connection.execute("SELECT data FROM projects WHERE id=?", (project_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Project not found")
    return json.loads(row["data"])


@app.post("/api/projects")
@app.put("/api/projects/{project_id}")
def save_project(input: ProjectInput, project_id: str | None = None, actor: str = Depends(require_admin)) -> dict[str, Any]:
    if project_id and project_id != input.id:
        raise HTTPException(400, "Project id mismatch")
    data = {**input.project, "id": input.id, "name": input.name}
    with db() as connection:
        connection.execute("INSERT INTO projects(id,data,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at", (input.id, json.dumps(data), time.time()))
    audit("project.saved", actor, {"project_id": input.id})
    return data


@app.get("/api/boards")
def list_boards(actor: str = Depends(require_admin)) -> list[dict[str, Any]]:
    with db() as connection:
        rows = connection.execute("SELECT data FROM boards ORDER BY id").fetchall()
    now = time.time()
    boards = []
    for row in rows:
        data = json.loads(row["data"])
        if data.get("last_seen", 0) < now - 15:
            data["status"] = "stale"
        boards.append(data)
    return boards


@app.post("/api/boards")
def register_board(input: BoardInput, actor: str = Depends(require_admin)) -> dict[str, Any]:
    token = input.token or secrets.token_urlsafe(24)
    data = input.model_dump(exclude={"token"})
    data["status"] = "registered"
    with db() as connection:
        connection.execute("INSERT INTO boards(id,project_id,token_hash,data,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET project_id=excluded.project_id, token_hash=excluded.token_hash, data=excluded.data, updated_at=excluded.updated_at", (input.id, input.project_id, hashlib.sha256(token.encode()).hexdigest(), json.dumps(data), time.time()))
    audit("board.registered", actor, {"board_id": input.id})
    return {**data, "token": token}


@app.post("/api/boards/{board_id}/heartbeat")
def heartbeat(board_id: str, x_device_token: str | None = Header(default=None)) -> dict[str, Any]:
    board = board_from_token(board_id, x_device_token)
    data = json.loads(board["data"])
    data.update({"status": "healthy", "last_seen": time.time()})
    with db() as connection:
        connection.execute("UPDATE boards SET data=?, updated_at=? WHERE id=?", (json.dumps(data), time.time(), board_id))
    return data


@app.post("/api/boards/{board_id}/readings")
def readings(board_id: str, payload: dict[str, Any], x_device_token: str | None = Header(default=None)) -> dict[str, Any]:
    board = board_from_token(board_id, x_device_token)
    if not isinstance(payload.get("readings"), list) or len(payload["readings"]) > 32:
        raise HTTPException(400, "readings must be an array")
    if any(not isinstance(item, dict) or not item.get("label") for item in payload["readings"]):
        raise HTTPException(400, "each reading needs a label")
    data = {"board_id": board_id, "readings": payload["readings"], "received_at": time.time()}
    with db() as connection:
        connection.execute("INSERT INTO readings(board_id,data,created_at) VALUES(?,?,?)", (board_id, json.dumps(data), time.time()))
        board_data = json.loads(board["data"])
        board_data.update({"status": "healthy", "last_seen": time.time(), "last_readings": data["readings"]})
        connection.execute("UPDATE boards SET data=?, updated_at=? WHERE id=?", (json.dumps(board_data), time.time(), board_id))
    return data


@app.get("/api/boards/{board_id}/history")
def history(board_id: str, limit: int = 100, actor: str = Depends(require_admin)) -> list[dict[str, Any]]:
    with db() as connection:
        rows = connection.execute("SELECT data FROM readings WHERE board_id=? ORDER BY id DESC LIMIT ?", (board_id, min(max(limit, 1), 1000))).fetchall()
    return [json.loads(row["data"]) for row in rows]


@app.post("/api/projects/{project_id}/fallback")
def activate_fallback(project_id: str, input: FallbackInput, actor: str = Depends(require_admin)) -> dict[str, Any]:
    project = get_project(project_id)
    project["fallback"] = {"active": True, "mode": input.mode, "reason": input.reason, "activated_at": time.time(), "source": "last-trusted" if input.mode == "last-trusted" else "simulated"}
    save_project(ProjectInput(id=project_id, name=project["name"], project=project), actor=actor)
    audit("project.fallback.enabled", actor, {"project_id": project_id, "reason": input.reason})
    return project["fallback"]


@app.post("/api/projects/{project_id}/fallback/restore")
def restore_fallback(project_id: str, actor: str = Depends(require_admin)) -> dict[str, Any]:
    project = get_project(project_id)
    project["fallback"] = {"active": False}
    save_project(ProjectInput(id=project_id, name=project["name"], project=project), actor=actor)
    audit("project.fallback.disabled", actor, {"project_id": project_id})
    return project["fallback"]


@app.post("/api/uploads")
async def upload(file: UploadFile = File(...), actor: str = Depends(require_admin)) -> dict[str, Any]:
    safe_name = Path(file.filename or "upload.bin").name
    content = await file.read(MAX_UPLOAD + 1)
    if len(content) > MAX_UPLOAD:
        raise HTTPException(413, "File is too large")
    upload_id = secrets.token_urlsafe(16)
    (UPLOAD_DIR / upload_id).write_bytes(content)
    data = {"id": upload_id, "name": safe_name, "type": file.content_type or "application/octet-stream", "size": len(content), "created_at": time.time()}
    with db() as connection:
        connection.execute("INSERT INTO config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (f"upload:{upload_id}", json.dumps(data)))
    audit("upload.created", actor, data)
    return data


@app.get("/api/uploads/{upload_id}")
def download_upload(upload_id: str, actor: str = Depends(require_admin)) -> FileResponse:
    if not upload_id or any(character not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-" for character in upload_id):
        raise HTTPException(400, "Invalid upload id")
    path = UPLOAD_DIR / upload_id
    if not path.is_file():
        raise HTTPException(404, "Upload not found")
    return FileResponse(path)


@app.websocket("/api/ws/projects/{project_id}")
async def project_socket(websocket: WebSocket, project_id: str) -> None:
    supplied_token = websocket.query_params.get("token", "")
    if not ADMIN_TOKEN or not secrets.compare_digest(supplied_token, ADMIN_TOKEN):
        await websocket.close(code=1008, reason="Admin authentication required")
        return
    await websocket.accept()
    try:
        while True:
            try:
                project = get_project(project_id)
            except HTTPException:
                project = {"id": project_id, "fallback": {"active": True, "source": "simulated"}}
            await websocket.send_json(project)
            await __import__("asyncio").sleep(2)
    except WebSocketDisconnect:
        return
