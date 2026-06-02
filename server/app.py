import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

app = Flask(__name__, static_folder=str(DOCS), static_url_path="")


@app.get("/")
def index():
    return send_from_directory(DOCS, "index.html")


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "mini_catalyst_center"})


@app.post("/api/command")
def command():
    payload = request.get_json(silent=True) or {}
    target = payload.get("target") or "192.168.1.1"
    command_text = payload.get("command") or "show interfaces status"

    if os.getenv("MCC_REAL_COMMANDS") == "1":
        from netmiko import ConnectHandler

        username = os.getenv("MCC_DEVICE_USERNAME")
        secret = os.getenv("MCC_DEVICE_SECRET")
        if not username or not secret:
            return jsonify({"ok": False, "error": "MCC_DEVICE_USERNAME and MCC_DEVICE_SECRET are required."}), 400

        device = {
            "device_type": os.getenv("MCC_DEVICE_TYPE", "cisco_ios"),
            "host": target,
            "username": username,
            "password": secret,
        }
        with ConnectHandler(**device) as connection:
            output = connection.send_command(command_text)
        return jsonify({"ok": True, "target": target, "command": command_text, "output": output})

    return jsonify({
        "ok": True,
        "target": target,
        "command": command_text,
        "output": (
            f"Demo command executed on {target}\n"
            f"{command_text}\n"
            "Gi1/0/1 connected demo-uplink\n"
            "Gi1/0/2 connected demo-access\n"
        ),
    })


@app.post("/api/upgrade")
def upgrade():
    payload = request.get_json(silent=True) or {}
    targets = payload.get("targets") or ["192.168.1.1"]
    image = payload.get("image") or "demo-catalyst-image.bin"
    return jsonify({
        "ok": True,
        "image": image,
        "targets": targets,
        "status": "queued",
        "note": "Upgrade is simulated by default. Build approval and image-copy logic before production use.",
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
