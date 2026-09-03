"""
Dam Telemetry Data Preprocessor (Person 1 Module)
Handles dataset cleaning, missing value checks, and feature preparation for ML training.
"""

import os
import pandas as pd
import numpy as np

def load_and_clean_data(file_path="data/dam_data.csv"):
    """
    Loads dataset, checks missing values, ensures types, and returns clean DataFrame.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file {file_path} not found. Run data/generate_data.py first.")
        
    df = pd.read_csv(file_path)
    
    # Handle missing values if any
    df["water_level"] = df["water_level"].fillna(method="ffill").fillna(50.0)
    df["rainfall"] = df["rainfall"].fillna(0.0)
    df["rise_rate"] = df["rise_rate"].fillna(0.0)
    
    # Ensure numerical types
    df["water_level"] = pd.to_numeric(df["water_level"], errors="coerce")
    df["rainfall"] = pd.to_numeric(df["rainfall"], errors="coerce")
    df["rise_rate"] = pd.to_numeric(df["rise_rate"], errors="coerce")
    
    print(f"[PREPROCESS] Loaded and cleaned {len(df)} records from {file_path}")
    return df

def get_feature_matrix(df):
    """
    Extracts feature matrix X (Water Level, Rainfall, Rise Rate) and target y (Risk Level).
    """
    feature_cols = ["water_level", "rainfall", "rise_rate"]
    X = df[feature_cols]
    y = df["risk_level"]
    return X, y

if __name__ == "__main__":
    df = load_and_clean_data()
    X, y = get_feature_matrix(df)
    print(f"[PREPROCESS] Feature shape: {X.shape}, Target distribution:\n{y.value_counts()}")
