import math
from typing import Any


def validate_readings(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list) or len(value) > 32:
        raise ValueError("readings must be an array of at most 32 values")
    for item in value:
        if not isinstance(item, dict):
            raise ValueError("each reading must be an object")
        label = item.get("label")
        reading = item.get("value")
        if not isinstance(label, str) or not label.strip() or len(label) > 80 or reading is None:
            raise ValueError("each reading needs a short label and a value")
        if isinstance(reading, bool) or not isinstance(reading, (int, float, str)):
            raise ValueError("reading values must be numbers or short text")
        if isinstance(reading, int) and abs(reading) > 1e9:
            raise ValueError("numeric reading is outside the allowed range")
        if isinstance(reading, float) and (not math.isfinite(reading) or abs(reading) > 1e9):
            raise ValueError("numeric reading is outside the allowed range")
        if isinstance(reading, str) and len(reading) > 160:
            raise ValueError("text reading exceeds 160 characters")
        for field, limit in (("unit", 24), ("note", 240)):
            if field in item and (not isinstance(item[field], str) or len(item[field]) > limit):
                raise ValueError(f"{field} must be text under {limit} characters")
    return value


def validate_sensor_metadata(payload: Any) -> dict[str, float]:
    if not isinstance(payload, dict):
        raise ValueError("telemetry payload must be an object")
    limits = {"board_temperature": (-80, 250), "voltage": (0, 100)}
    result = {}
    for field, (minimum, maximum) in limits.items():
        value = payload.get(field)
        if value is None:
            continue
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not minimum <= value <= maximum:
            raise ValueError(f"{field} is outside the allowed sensor range")
        result[field] = value
    return result


def admin_token_from_subprotocols(protocols: list[str]) -> str:
    return next((part.removeprefix("circux-admin-token.") for part in protocols if part.startswith("circux-admin-token.")), "")
