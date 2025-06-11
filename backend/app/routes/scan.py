
from flask import Blueprint, request, jsonify
import subprocess

scan_bp = Blueprint("scan", __name__)

@scan_bp.route("/nmap", methods=["POST"])
def nmap_scan():
    data = request.get_json()
    target = data.get("target")
    args = data.get("args", "-sV")
    if not target:
        return jsonify({"error": "La cible est requise"}), 400
    try:
        command = f"nmap {args} {target}"
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            return jsonify({"error": result.stderr}), 500
        return jsonify({"result": result.stdout})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

