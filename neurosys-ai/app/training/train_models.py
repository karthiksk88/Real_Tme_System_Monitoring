import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier

def train_and_save_models():
    print("Training NeuroSys Machine Learning Models...")
    os.makedirs("./models", exist_ok=True)

    # 1. CPU Forecaster Model
    X_train = np.random.rand(100, 3) * 100.0
    y_train = X_train.mean(axis=1) + (np.random.randn(100) * 2.0)
    cpu_model = RandomForestRegressor(n_estimators=50, random_state=42)
    cpu_model.fit(X_train, y_train)
    joblib.dump(cpu_model, "./models/cpu_forecaster.joblib")

    # 2. Crash Risk Classifier
    X_crash = np.random.rand(100, 5) * 100.0
    y_crash = (X_crash[:, 0] > 80.0).astype(int)
    crash_model = GradientBoostingClassifier(n_estimators=50, random_state=42)
    crash_model.fit(X_crash, y_crash)
    joblib.dump(crash_model, "./models/crash_classifier.joblib")

    print("Successfully trained and saved model binaries to ./models/")

if __name__ == "__main__":
    train_and_save_models()
