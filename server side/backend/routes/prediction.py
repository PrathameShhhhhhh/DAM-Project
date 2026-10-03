"""
AI/ML Prediction API Routes (Person 3 Module)
"""

import sys
import os
from flask import Blueprint, request, jsonify

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from ml.predict import predict_risk
from backend.database import get_latest_reading_and_prediction

prediction_bp = Blueprint("prediction", __name__)

@prediction_bp.route("/api/prediction", methods=["GET"])
def get_prediction():
    """Fetches latest prediction state."""
    latest = get_latest_reading_and_prediction()
    if latest:
        return jsonify({
            "status": "success",
            "risk_level": latest.get("risk_level"),
            "probability": latest.get("probability"),
            "t_critical": latest.get("t_critical"),
            "timestamp": latest.get("timestamp")
        }), 200
        
    res = predict_risk(68.5, 18.0, 0.8)
    return jsonify({
        "status": "success",
        "risk_level": res["risk_level"],
        "probability": res["probability"],
        "t_critical": res["t_critical_display"],
        "timestamp": "Now"
    }), 200

@prediction_bp.route("/api/predict", methods=["POST"])
def post_predict():
    """Runs on-demand ML model evaluation for playground/simulator inputs."""
    body = request.get_json() or {}
    try:
        water_level = float(body.get("water_level", 65.0))
        rainfall = float(body.get("rainfall", 0.0))
        rise_rate = float(body.get("rise_rate", 0.0))
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "Invalid parameters"}), 400

    res = predict_risk(water_level, rainfall, rise_rate)
    return jsonify({
        "status": "success",
        "inputs": {
            "water_level": water_level,
            "rainfall": rainfall,
            "rise_rate": rise_rate
        },
        "prediction": res
    }), 200
