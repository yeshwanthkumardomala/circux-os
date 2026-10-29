# Hardware adapter contract

Circux keeps the browser UI safe by default. Real hardware is connected through a small HTTP adapter that runs on the same trusted network as the relay.

Set these variables before starting the relay:

```powershell
$env:CIRCUX_DEVICE_URL = 'http://192.168.1.50:8080'
$env:CIRCUX_DEVICE_KEY = 'replace-with-a-long-random-secret'
npm run exhibition
```

The FastAPI admin token is separate from `CIRCUX_DEVICE_KEY` and each board's device token. Set `CIRCUX_ADMIN_TOKEN` in the repository-root `.env` file. On Windows, `RUN-CIRCUX.bat` creates a random token when needed, saves it to `.env`, and prints it in the launch window. Use that admin token in the browser prompt and Board Health screen. Keep the launch window private.

For a fixed browser origin, set `CIRCUX_ALLOWED_ORIGIN` as well. Without it, the relay accepts browser requests only from the same host on ports 3000 or 3001.

The adapter must provide:

- `GET /health` → `{ "ok": true, "device": "..." }`
- `GET /readings` → `{ "readings": [{ "label": "Temperature", "value": "24.8 C", "note": "sensor" }] }`
- `POST /command` with `{ "action": "wake" | "restart" | "power-off" }` → a JSON result

For Arduino boards connected by USB to a working laptop, use the included serial agent. The board should emit one JSON object per line and remain in sensor-only/read-only mode:

```powershell
python backend/agent.py --port COM6 --board-id CX-104-BOARD-1 --token DEVICE_TOKEN --api http://MAIN-COMPUTER-IP:8000
```

Example serial line:

```json
{"readings":[{"label":"Temperature","value":24.8,"unit":"C"}],"temperature":31.2,"voltage":5.0}
```

The agent sends a heartbeat every five seconds and rejects non-array readings. It does not send actuator commands.

The API marks a board stale after 15 seconds without a heartbeat. Keep boards in their firmware's low-power/read-only mode during exhibition testing; Circux accepts sensor readings and sends no hardware output commands.

Test the backend without a device:

```powershell
npm run test:relay
```

Test a real adapter manually:

```powershell
Invoke-RestMethod http://localhost:3002/device/health
Invoke-RestMethod http://localhost:3002/device/readings
Invoke-RestMethod http://localhost:3002/device/command -Method Post -Headers @{ 'x-circux-device-key' = $env:CIRCUX_DEVICE_KEY } -ContentType 'application/json' -Body '{"action":"wake"}'
```

Do not expose the relay directly to the public internet. Use a private network, HTTPS, and a real device gateway before connecting anything that can move, heat, pump, or switch mains power.
