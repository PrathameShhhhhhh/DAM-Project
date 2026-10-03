"""
System Settings & Threshold API Routes (Person 3 Module)
"""

from flask import Blueprint, request, jsonify
from backend.database import get_thresholds, update_thresholds

settings_bp = Blueprint("settings", __name__)

@settings_bp.route("/api/settings", methods=["GET"])
def fetch_settings():
    """Returns safety threshold settings."""
    thresholds = get_thresholds()
    return jsonify({
        "status": "success",
        "thresholds": thresholds
    }), 200

@settings_bp.route("/api/update-threshold", methods=["POST"])
def post_update_threshold():
    """Updates warning/critical dam water level thresholds."""
    body = request.get_json() or {}
    try:
        safe_max = float(body.get("safe_max", 70.0))
        warning_max = float(body.get("warning_max", 80.0))
        high_max = float(body.get("high_max", 90.0))
        critical_max = float(body.get("critical_max", 95.0))
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "Invalid threshold numbers"}), 400

    updated = update_thresholds(safe_max, warning_max, high_max, critical_max)
    return jsonify({
        "status": "success",
        "message": "Thresholds updated successfully",
        "thresholds": updated
    }), 200
