"""
Alert & Siren API Routes (Person 3 Module)
"""

from flask import Blueprint, request, jsonify
from backend.database import get_alerts, save_alert

alerts_bp = Blueprint("alerts", __name__)

@alerts_bp.route("/api/alerts", methods=["GET"])
def fetch_alerts():
    """Returns stored alert records."""
    limit = request.args.get("limit", default=50, type=int)
    alerts = get_alerts(limit=limit)
    return jsonify({
        "status": "success",
        "alerts": alerts
    }), 200

@alerts_bp.route("/api/alerts", methods=["POST"])
def create_alert():
    """Triggers and logs a manual or system emergency alert."""
    body = request.get_json() or {}
    risk_level = body.get("risk_level", "HIGH RISK")
    alert_type = body.get("alert_type", "MANUAL_OVERRIDE_ALERT")
    message = body.get("message", "Manual emergency siren activated from control dashboard.")
    zone = body.get("zone", "Downstream Sector A")
    
    alert_id = save_alert(risk_level, alert_type, message, zone, status="ACTIVE")
    return jsonify({
        "status": "success",
        "alert_id": alert_id,
        "message": "Alert triggered and stored successfully"
    }), 201
