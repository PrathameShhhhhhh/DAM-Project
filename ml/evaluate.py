"""
Dam ML Model Evaluation Script (Person 2 Module)
Evaluates accuracy, confusion matrix, and feature importances of the trained ML model.
"""

import os
import sys
import joblib
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from data.preprocess import load_and_clean_data, get_feature_matrix
from ml.predict import MODEL_PATH

def evaluate_model():
    if not os.path.exists(MODEL_PATH):
        print(f"Model file {MODEL_PATH} not found. Please train model first.")
        return
        
    model = joblib.load(MODEL_PATH)
    df = load_and_clean_data("data/dam_data.csv")
    X, y = get_feature_matrix(df)
    
    accuracy = model.score(X, y)
    print(f"=== DAM AI MODEL EVALUATION ===")
    print(f"Overall Dataset Accuracy: {accuracy * 100:.2f}%")
    
    if hasattr(model, "feature_importances_"):
        print("\nFeature Importances:")
        for col, imp in zip(X.columns, model.feature_importances_):
            print(f" - {col:15s}: {imp * 100:.2f}%")

if __name__ == "__main__":
    evaluate_model()
