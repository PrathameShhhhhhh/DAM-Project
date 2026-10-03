"""
Dam Risk AI/ML Model Training Pipeline (Person 2 Module)
Trains a Random Forest Classifier on IoT telemetry features [water_level, rainfall, rise_rate]
and saves the trained model artifact to ml/model.pkl.
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

# Add parent directory to path for data imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from data.preprocess import load_and_clean_data, get_feature_matrix

MODEL_PATH = "ml/model.pkl"

def train_and_save_model(data_path="data/dam_data.csv", output_model_path=MODEL_PATH):
    """
    Loads data, trains RandomForest model, prints metrics, and exports model.pkl.
    """
    df = load_and_clean_data(data_path)
    X, y = get_feature_matrix(df)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"[ML TRAIN] Training Random Forest model on {len(X_train)} samples...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        random_state=42,
        class_weight="balanced"
    )
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"[ML TRAIN] Model Test Accuracy: {accuracy * 100:.2f}%")
    print("[ML TRAIN] Classification Report:\n", classification_report(y_test, y_pred))
    
    os.makedirs(os.path.dirname(output_model_path), exist_ok=True)
    joblib.dump(model, output_model_path)
    print(f"[ML TRAIN] Model saved successfully to {output_model_path}")
    return model, accuracy

if __name__ == "__main__":
    train_and_save_model()
