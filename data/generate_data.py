"""
Dam Telemetry Dataset Generator (Person 1 Module)
Generates realistic historical dam telemetry data (water level, rainfall, rise rate)
and risk level labels for training and backend simulation.
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_dam_dataset(num_records=1200, output_path="data/dam_data.csv"):
    """
    Generates synthetic dam telemetry records spanning multiple operational scenarios:
    1. Normal day operations (Safe)
    2. Heavy rainfall periods (Warning)
    3. Flash surge / rapid inflow (High Risk)
    4. Dam overflow risk (Critical)
    """
    np.random.seed(42)
    records = []
    start_time = datetime.now() - timedelta(days=10)
    
    current_wl = 62.0  # initial water level %
    current_rain = 10.0 # initial rainfall mm/hr
    
    for i in range(num_records):
        timestamp = start_time + timedelta(minutes=15 * i)
        
        # Scenario switching based on timeline segments
        if i % 300 < 150:
            # Normal Day Scenario
            target_rain = max(0, np.random.normal(5, 4))
            wl_change = np.random.normal(-0.1, 0.2)
        elif i % 300 < 220:
            # Heavy Rain Scenario
            target_rain = max(15, np.random.normal(45, 12))
            wl_change = np.random.normal(0.6, 0.3)
        elif i % 300 < 270:
            # Heavy Surge / Torrential Rain Scenario
            target_rain = max(50, np.random.normal(90, 20))
            wl_change = np.random.normal(1.8, 0.5)
        else:
            # Critical Overrun Surge Scenario
            target_rain = max(80, np.random.normal(130, 25))
            wl_change = np.random.normal(3.2, 0.8)
            
        current_rain = round(float(target_rain), 1)
        current_wl = float(np.clip(current_wl + wl_change, 15.0, 99.5))
        rise_rate = round(float(wl_change * 4), 2) # scaled to % per hour (15min * 4)
        
        # Heuristic Risk Labeling for ML dataset target
        if current_wl >= 95.0 or (current_wl >= 88.0 and rise_rate > 4.0):
            risk_level = "CRITICAL"
        elif current_wl >= 85.0 or (current_wl >= 78.0 and rise_rate > 2.5):
            risk_level = "HIGH RISK"
        elif current_wl >= 72.0 or (current_wl >= 65.0 and rise_rate > 1.2):
            risk_level = "WARNING"
        else:
            risk_level = "SAFE"
            
        records.append({
            "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "water_level": round(current_wl, 1),
            "rainfall": current_rain,
            "rise_rate": rise_rate,
            "risk_level": risk_level
        })
        
    df = pd.DataFrame(records)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"[DATA GENERATOR] Successfully generated {len(df)} telemetry records -> {output_path}")
    return df

if __name__ == "__main__":
    generate_dam_dataset()
