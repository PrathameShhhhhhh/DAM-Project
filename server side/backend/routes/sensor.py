"""
Sensor & Telemetry API Routes (Person 3 Module)
"""

import sys
import os
from flask import Blueprint, request, jsonify

# Include root dir to import ml module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from ml.predict import predict_risk
from backend.database import (
    save_sensor_reading,
    save_prediction,
    get_latest_reading_and_prediction,
    get_sensor_history,
    save_alert,
    get_thresholds
)

sensor_bp = Blueprint("sensor", __name__)

@sensor_bp.route("/api/current-data", methods=["GET"])
def get_current_data():
    """Returns latest sensor reading and prediction."""
    latest = get_latest_reading_and_prediction()
    thresholds = get_thresholds()
    
    if not latest:
        # Fallback initial baseline if DB is empty
        pred = predict_risk(68.5, 18.0, 0.8)
        latest = {
            "timestamp": "Now",
            "water_level": 68.5,
            "rainfall": 18.0,
            "rise_rate": 0.8,
            "risk_level": pred["risk_level"],
            "probability": pred["probability"],
            "t_critical": pred["t_critical_display"]
        }
        
    return jsonify({
        "status": "success",
        "data": latest,
        "thresholds": thresholds
    }), 200

@sensor_bp.route("/api/sensor-data", methods=["POST"])
def post_sensor_data():
    """
    Ingests IoT/simulated sensor reading, triggers ML model inference,
    stores records in SQLite DB, triggers alerts if necessary, and returns complete risk object.
    """
    body = request.get_json() or {}
    
    try:
        water_level = float(body.get("water_level", 65.0))
        rainfall = float(body.get("rainfall", 0.0))
        rise_rate = float(body.get("rise_rate", 0.0))
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "Invalid numeric sensor inputs"}), 400

    # 1. Save raw sensor reading
    sensor_id = save_sensor_reading(water_level, rainfall, rise_rate)
    
    # 2. Run ML inference
    pred = predict_risk(water_level, rainfall, rise_rate)
    
    # 3. Save prediction linked to sensor reading
    save_prediction(
        sensor_data_id=sensor_id,
        risk_level=pred["risk_level"],
        probability=pred["probability"],
        t_critical=pred["t_critical_display"]
    )
    
    # 4. Auto Trigger Alert logging if High Risk or Critical
    if pred["risk_level"] == "CRITICAL":
        save_alert(
            risk_level="CRITICAL",
            alert_type="DAM_OVERRUN_ALERT",
            message=f"CRITICAL FLOOD ALERT: Water level at {water_level:.1f}%. Immediate evacuation ordered for Downstream Sector A.",
            zone="Downstream Sector A",
            status="ACTIVE"
        )
    elif pred["risk_level"] == "HIGH RISK":
        save_alert(
            risk_level="HIGH RISK",
            alert_type="HIGH_SURGE_WARNING",
            message=f"HIGH RISK WARNING: Water rise rate high ({rise_rate:.2f}%/hr). Emergency response teams notified.",
            zone="Sector B & Downstream",
            status="WARNING"
        )

    return jsonify({
        "status": "success",
        "sensor_id": sensor_id,
        "water_level": water_level,
        "rainfall": rainfall,
        "rise_rate": rise_rate,
        "risk_level": pred["risk_level"],
        "probability": pred["probability"],
        "t_critical": pred["t_critical_display"],
        "t_critical_hours": pred["t_critical_hours"]
    }), 201

@sensor_bp.route("/api/history", methods=["GET"])
def get_history():
    """Returns recent historical telemetry readings for UI charts."""
    limit = request.args.get("limit", default=30, type=int)
    history = get_sensor_history(limit=limit)
    return jsonify({
        "status": "success",
        "count": len(history),
        "history": history
    }), 200
