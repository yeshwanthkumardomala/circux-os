"""USB-serial board agent.

The board must emit one JSON object per line, for example:
{"readings":[{"label":"Temperature","value":24.8,"unit":"C"}],"temperature":31.2,"voltage":5.0}
"""
import argparse
import json
import os
import time
import urllib.request

import serial


def post(url: str, token: str, payload: dict) -> None:
    request = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json", "X-Device-Token": token}, method="POST")
    with urllib.request.urlopen(request, timeout=5):
        pass


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", required=True)
    parser.add_argument("--board-id", required=True)
    parser.add_argument("--token", required=True)
    parser.add_argument("--api", default=os.getenv("CIRCUX_API_URL", "http://127.0.0.1:8000"))
    parser.add_argument("--baud", type=int, default=115200)
    args = parser.parse_args()
    serial_port = serial.Serial(args.port, args.baud, timeout=2)
    last_heartbeat = 0.0
    while True:
        now = time.time()
        if now - last_heartbeat >= 5:
            try: post(f"{args.api}/api/boards/{args.board_id}/heartbeat", args.token, {"mode": "monitoring", "read_only": True})
            except Exception as error: print(f"heartbeat failed: {error}")
            last_heartbeat = now
        raw = serial_port.readline().decode(errors="replace").strip()
        if not raw: continue
        try:
            payload = json.loads(raw)
            if not isinstance(payload.get("readings"), list): raise ValueError("readings must be an array")
            post(f"{args.api}/api/boards/{args.board_id}/readings", args.token, {"readings": payload["readings"], "board_temperature": payload.get("temperature"), "voltage": payload.get("voltage"), "mode": "monitoring", "read_only": True})
        except Exception as error:
            print(f"reading rejected: {error}")


if __name__ == "__main__": main()
