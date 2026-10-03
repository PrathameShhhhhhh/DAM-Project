"""
Dam Risk AI/ML Prediction & T_critical Engine (Person 2 Module)
Provides live risk classification, risk probability, and time-to-critical calculations.
"""

import os
import joblib
import numpy as np
import pandas as pd

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "model.pkl"))

_cached_model = None

def get_model():
    """Lazy loader for trained ML model."""
    global _cached_model
    if _cached_model is None:
        if os.path.exists(MODEL_PATH):
            try:
                _cached_model = joblib.load(MODEL_PATH)
                print(f"[ML PREDICT] Loaded ML model from {MODEL_PATH}")
            except Exception as e:
                print(f"[ML PREDICT] Error loading model: {e}")
                _cached_model = None
    return _cached_model

def predict_risk(water_level, rainfall, rise_rate, H_max=100.0):
    """
    Inputs:
        water_level (float): Current dam water level % (0-100)
        rainfall (float): Rainfall intensity in mm/hr
        rise_rate (float): Rate of water rise in %/hr
        H_max (float): Maximum dam capacity threshold (default 100%)

    Outputs dict:
        {
            "risk_level": "SAFE" | "WARNING" | "HIGH RISK" | "CRITICAL",
            "probability": int (0-100),
            "t_critical_hours": float | None,
            "t_critical_display": str
        }
    """
    wl = float(water_level)
    rf = float(rainfall)
    rr = float(rise_rate)

    model = get_model()
    
    risk_level = "SAFE"
    risk_prob = 15

    if model is not None:
        try:
            # Predict Risk Class
            features = pd.DataFrame([{"water_level": wl, "rainfall": rf, "rise_rate": rr}])
            risk_level = model.predict(features)[0]
            
            # Predict Probabilities
            probs = model.predict_proba(features)[0]
            classes = model.classes_
            
            # Extract probability corresponding to predicted class or critical class
            class_prob_map = dict(zip(classes, probs))
            
            # Weighted Ensemble Score calculation for fine-grained probability
            critical_prob = class_prob_map.get("CRITICAL", 0.0) * 1.0
            high_prob = class_prob_map.get("HIGH RISK", 0.0) * 0.75
            warn_prob = class_prob_map.get("WARNING", 0.0) * 0.50
            safe_prob = class_prob_map.get("SAFE", 0.0) * 0.15
            
            score = critical_prob + high_prob + warn_prob + safe_prob
            risk_prob = int(np.clip(score * 100, 5, 99))
        except Exception as e:
            print(f"[ML PREDICT] Model prediction error: {e}, falling back to heuristic")
            risk_level, risk_prob = _heuristic_fallback(wl, rf, rr)
    else:
        risk_level, risk_prob = _heuristic_fallback(wl, rf, rr)

    # Time-to-Critical Formula: T_critical = (H_max - h(t)) / (dh/dt)
    t_critical_hours = None
    t_critical_display = "STABLE"

    if rr > 0 and wl < H_max:
        t_critical_hours = round((H_max - wl) / rr, 2)
        
        hours = int(t_critical_hours)
        minutes = int(round((t_critical_hours - hours) * 60))
        
        if hours > 48:
            t_critical_display = "> 48 Hours"
        elif hours > 0:
            t_critical_display = f"{hours}h {minutes}m"
        else:
            t_critical_display = f"{minutes} mins"
    elif wl >= H_max:
        t_critical_hours = 0.0
        t_critical_display = "CRITICAL (OVERFLOW)"

    return {
        "risk_level": risk_level,
        "probability": risk_prob,
        "t_critical_hours": t_critical_hours,
        "t_critical_display": t_critical_display
    }

def _heuristic_fallback(wl, rf, rr):
    norm_wl = wl / 100.0
    norm_rf = min(120.0, rf) / 120.0
    norm_rr = max(0.0, min(10.0, rr)) / 10.0

    score = (norm_wl * 0.45) + (norm_rf * 0.25) + (norm_rr * 0.30)
    prob = int(np.clip(score * 100, 5, 99))

    if wl >= 95.0 or score >= 0.82:
        level = "CRITICAL"
    elif wl >= 88.0 or score >= 0.65:
        level = "HIGH RISK"
    elif wl >= 75.0 or score >= 0.45:
        level = "WARNING"
    else:
        level = "SAFE"
    return level, prob

if __name__ == "__main__":
    test_cases = [
        (65.0, 10.0, 0.5),
        (78.0, 35.0, 1.8),
        (88.0, 75.0, 3.5),
        (96.0, 120.0, 6.0)
    ]
    for wl, rf, rr in test_cases:
        res = predict_risk(wl, rf, rr)
        print(f"Input: WL={wl}%, Rain={rf}mm, Rise={rr}%/hr -> {res}")
