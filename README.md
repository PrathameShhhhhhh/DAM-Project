# Smart Dam Safety & Flood Risk AI Monitoring System (DAM MONITOR AI PRO)

An end-to-end software platform for real-time dam safety monitoring, flood risk prediction using Machine Learning, persistent telemetry logging, and automated emergency siren/alert dispatches.

---

## 🏗️ System Architecture & Workflow

```
[ IoT Sensors / Simulator ] 
           │
           ▼ (HTTP POST /api/sensor-data)
┌─────────────────────────────────────────┐
│           Python Flask Backend          │
│   - Sensor Data Ingestion               │
│   - SQLite / MySQL Data Storage         │
│   - ML Ingestion & T_critical Calculation│
└────────────────────┬────────────────────┘
                     │
           ┌─────────┴─────────┐
           ▼                   ▼
┌──────────────────┐   ┌───────────────────────────┐
│ AI/ML Risk Model │   │     SQLite Database       │
│  (Random Forest) │   │ (sensor_data, predictions,│
│  [ml/model.pkl]  │   │  alerts, settings)        │
└──────────────────┘   └───────────────────────────┘
                     │
                     ▼ (REST API JSON Response)
┌─────────────────────────────────────────┐
│     Interactive HTML5/JS Dashboard      │
│  - Live Telemetry Stream Charts         │
│  - AI Risk Engine & T_critical Display  │
│  - Emergency Siren & Alert Log          │
└─────────────────────────────────────────┘
```

---

## 👥 4-Person Role Division

1. **Person 1 — Data & IoT Simulation (`data/`)**: Synthetic IoT data generator (`generate_data.py`), dataset cleaning (`preprocess.py`), and CSV storage (`dam_data.csv`).
2. **Person 2 — AI / Machine Learning (`ml/`)**: Model training pipeline (`train_model.py`), Random Forest classification model (`model.pkl`), prediction engine (`predict.py`), time-to-critical equation ($T_{\text{critical}} = \frac{H_{\text{max}} - h(t)}{dh/dt}$), and evaluation metrics (`evaluate.py`).
3. **Person 3 — Backend & Database (`backend/`, `database/`)**: Flask REST API server (`app.py`), route blueprints (`sensor.py`, `prediction.py`, `alerts.py`, `settings.py`), and SQLite/MySQL database layer (`database.py`, `schema.sql`).
4. **Person 4 — Frontend Dashboard (`index.html`, `css/`, `js/`)**: Responsive glassmorphic UI, Chart.js telemetry charts, simulator playground, Web Audio siren synthesizer, and `js/api.js` backend integration.

---

## 📂 Project Directory Structure

```
DAM Project/
├── index.html                      # Main Dashboard UI
├── css/
│   └── style.css                   # Glassmorphic Styling & Layout
├── js/
│   ├── api.js                      # Backend API Integration Client
│   └── app.js                      # Core Dashboard Application Logic
├── data/
│   ├── generate_data.py            # IoT Sensor Data Generator
│   ├── preprocess.py               # Data Preprocessing Script
│   └── dam_data.csv                # Generated Sensor Telemetry CSV
├── ml/
│   ├── train_model.py              # Scikit-Learn Model Trainer
│   ├── predict.py                  # Live Risk & T_critical Prediction Engine
│   ├── evaluate.py                 # Model Accuracy Evaluation Script
│   └── model.pkl                   # Trained Random Forest Model Artifact
├── backend/
│   ├── app.py                      # Flask REST API Application Entrypoint
│   ├── config.py                   # App Configuration Settings
│   ├── database.py                 # SQLite Database Abstraction Layer
│   ├── dam_monitor.db              # SQLite Database File
│   └── routes/
│       ├── sensor.py               # Telemetry & History Endpoints
│       ├── prediction.py           # Prediction Endpoints
│       ├── alerts.py               # Siren & Alert Log Endpoints
│       └── settings.py             # Safety Threshold Endpoints
├── database/
│   ├── schema.sql                  # Database DDL Schema (SQLite & MySQL)
│   └── seed.sql                    # Initial Database Seed Script
├── requirements.txt                # Python Dependencies
├── .env.example                    # Environment Template
└── README.md                       # Project Documentation
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Ensure Python 3.8+ is installed, then run:
```bash
pip install -r requirements.txt
```

### 2. Generate Sensor Dataset
```bash
python data/generate_data.py
```

### 3. Train AI / Machine Learning Model
```bash
python ml/train_model.py
```

### 4. Start Flask Backend REST API
```bash
python backend/app.py
```
The Flask backend will launch at `http://localhost:5000` and automatically initialize the database schema and seed settings.

### 5. Launch Dashboard
Open `http://localhost:5000` in your web browser or open `index.html` directly. The top header will display **`FLASK REST API & ML ACTIVE`** when connected.

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check and backend status |
| `GET` | `/api/current-data` | Latest sensor telemetry reading and ML prediction |
| `POST` | `/api/sensor-data` | Submit new telemetry reading, run ML inference, store in DB, return risk assessment |
| `GET` | `/api/history` | Historical sensor readings for telemetry charts |
| `GET` | `/api/prediction` | Latest AI prediction state |
| `POST` | `/api/predict` | On-demand ML inference for test parameters |
| `GET` | `/api/alerts` | Fetch persistent alert and siren log history |
| `POST` | `/api/alerts` | Trigger emergency alert or siren state |
| `GET` | `/api/settings` | Fetch safety threshold settings |
| `POST` | `/api/update-threshold` | Update safety, warning, and critical thresholds |
