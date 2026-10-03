# Reservoir Hydraulic Telemetry & Flood Early Warning System

An end-to-end telemetry and disaster management platform for dam safety monitoring, hydrodynamic flood risk classification, automated siren broadcast, and citizen early warnings.

The project is structured into two primary components:
- **Server Side**: Telemetry ingestion, machine learning risk classification, relational SQLite persistence, Flask REST API, and the Operator Monitoring Console.
- **Client Side**: Minimalist, multi-lingual Community Flood Alert Web Application for citizens and local authorities.

---

## System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    SERVER SIDE ENGINE                     │
│                                                           │
│  [ IoT Sensors / Simulator ]                              │
│              │ (POST /api/sensor-data)                    │
│              ▼                                            │
│  [ Python Flask REST API (Port 5001) ]                    │
│      ├── SQLite Database Layer (telemetry, alerts)        │
│      └── Random Forest ML Classifier (Risk & T_critical)   │
│              │                                            │
│              ├─────────────────────────┐                  │
│              ▼                         ▼                  │
│   [ Operator Dashboard ]      [ REST API Endpoints ]      │
└────────────────────────────────────────┼──────────────────┘
                                         │ JSON Stream / Telemetry
                                         ▼
┌───────────────────────────────────────────────────────────┐
│                    CLIENT SIDE APP                        │
│                                                           │
│  [ Citizen Flood Alert Application ]                      │
│      ├── Citizen Auth (Mobile + OTP Sign In / Sign Up)    │
│      ├── Live Water Level & Universal Safety Badges       │
│      ├── Location-Based Rainfall & Weather Forecast       │
│      ├── Multi-Lingual Switcher (English, Hindi, Marathi) │
│      └── Audio Emergency Siren Synthesizer & Toggles      │
└───────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
DAM Project/
├── server side/                     # Server-Side Backend & ML Engine
│   ├── backend/
│   │   ├── app.py                   # Flask REST API Application Entrypoint
│   │   ├── config.py                # Server Configuration (Port 5001, Host)
│   │   ├── database.py              # SQLite Database Abstraction Layer
│   │   ├── dam_monitor.db           # SQLite Database Store
│   │   └── routes/
│   │       ├── sensor.py            # Sensor Data & History Endpoints
│   │       ├── prediction.py        # ML Prediction Endpoints
│   │       ├── alerts.py            # Emergency Siren & Alert Log Endpoints
│   │       └── settings.py          # Safety Thresholds Endpoints
│   ├── data/
│   │   ├── generate_data.py         # Synthetic Hydrological Telemetry Generator
│   │   ├── preprocess.py            # Dataset Cleaning & Feature Preprocessing
│   │   └── dam_data.csv             # Generated Telemetry Dataset
│   ├── ml/
│   │   ├── train_model.py           # Random Forest Classifier Training Pipeline
│   │   ├── predict.py               # Live Inference & T_critical Engine
│   │   ├── evaluate.py              # Model Evaluation & Feature Importances
│   │   └── model.pkl                # Exported Scikit-Learn Model Artifact
│   ├── database/
│   │   ├── schema.sql               # Database DDL Schema
│   │   └── seed.sql                 # Initial Settings Seed Script
│   ├── index.html                   # Operator Monitoring Console
│   ├── css/ & js/                   # Operator Portal Styles & API Client
│   ├── privacy.html & terms.html    # Operator Compliance Documents
│   ├── favicon.svg                  # Vector Favicon Asset
│   ├── requirements.txt             # Python Dependencies
│   └── .env.example                 # Environment Variable Template
│
├── client side/                     # Citizen Community Flood Alert App
│   ├── index.html                   # Main Community Mobile/Web App
│   ├── css/
│   │   └── style.css                # Minimalist, High-Legibility UI
│   ├── js/
│   │   ├── i18n.js                  # English / Hindi / Marathi Localization Dictionary
│   │   └── app.js                   # Auth, Geolocation, Live Water Stream & Siren Logic
│   ├── privacy.html                 # Citizen Privacy Policy
│   ├── terms.html                   # Citizen Terms & Conditions
│   └── favicon.svg                  # Community Favicon Asset
│
└── README.md                        # Unified Project Documentation
```

---

## Server Side Setup & Execution

### 1. Install Backend Dependencies
Ensure Python 3.8+ is installed, then install required packages:
```bash
pip install -r "server side/requirements.txt"
```

### 2. Generate Sensor Dataset
Generate synthetic telemetry records with hydrological noise and surge conditions:
```bash
python "server side/data/generate_data.py"
```
Output: `server side/data/dam_data.csv` (1,200 records).

### 3. Train Machine Learning Model
Train the Random Forest Classifier on feature matrix ($X = [\text{Water Level}, \text{Rainfall}, \frac{dh}{dt}]$):
```bash
python "server side/ml/train_model.py"
```
Output: `server side/ml/model.pkl` (97.5%+ test accuracy).

Optional evaluation:
```bash
python "server side/ml/evaluate.py"
```

### 4. Start Flask REST API Server
```bash
python "server side/backend/app.py"
```
The server will start at `http://localhost:5001`.

### 5. Access the Operator Monitoring Console
Navigate to `http://localhost:5001/` in your web browser.
The Flask backend will launch at `http://localhost:5001` and automatically initialize the database schema and seed settings.

### 5. Launch Dashboard
Open `http://localhost:5001` in your web browser or open `index.html` directly. The top header will display **`FLASK REST API & ML ACTIVE`** when connected.

---

## Server REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check and system status |
| `GET` | `/api/current-data` | Latest sensor telemetry reading and risk prediction |
| `POST` | `/api/sensor-data` | Ingest sensor reading, run ML inference, persist to DB |
| `GET` | `/api/history` | Historical sensor readings for telemetry charts |
| `GET` | `/api/prediction` | Latest AI prediction state |
| `POST` | `/api/predict` | On-demand ML inference for custom test parameters |
| `GET` | `/api/alerts` | Fetch stored alert and siren dispatch history |
| `POST` | `/api/alerts` | Trigger emergency alert or siren state |
| `GET` | `/api/settings` | Fetch safety threshold settings |
| `POST` | `/api/update-threshold` | Update safety, warning, and critical thresholds |

---

## Client Side Setup & Features

The Client Side App is designed for everyday citizens, downstream residents, and emergency response workers across all age groups.

### Features Included

1. **Simple Citizen Registration & Sign-In**:
   - **Sign Up**: Full Name, 10-digit Mobile Number, simulated OTP verification with auto-fill helper.
   - **Sign In**: Registered Mobile Number and OTP verification with persistent `localStorage` session.
   - **Sign Out**: Instant profile logout returning to the sign-in screen.

2. **Multilingual Translation Switch (English, Hindi, Marathi)**:
   - Instant header language switcher: `EN`, `हिंदी` (Hindi), and `मराठी` (Marathi).
   - Dynamic localization dictionary (`client side/js/i18n.js`) translating all titles, advisories, weather reports, labels, and emergency dialogs.

3. **Live Water Level Monitor**:
   - Visual water gauge with clear percentage readout (e.g. `68.5%`) and fill progress bar.
   - Tri-state universal safety badges: `SAFE` (Green), `MODERATE ALERT` (Amber), and `CRITICAL DANGER` (Red).
   - Plain-language community advisories on river bank and downstream safety.

4. **Location-Based Rainfall & Weather Prediction**:
   - Integrates browser Geolocation API (`Detect Location`) with catchment basin identification (e.g., *Pune / Khadakwasla Basin*, *Nashik / Godavari Basin*, *Kolhapur / Panchganga Basin*, *Mumbai / Vaitarna Catchment*).
   - 24-hour rain probability, expected precipitation rate (mm/hr), and localized flood hazard rating.

5. **Acoustic Siren & Alert Switches**:
   - On/Off toggle switch for **Acoustic Emergency Siren** (Web Audio API frequency sweep oscillator).
   - On/Off toggle switch for **Screen Notification Alerts**.
   - **Test Audio Siren** button allowing citizens to verify device audio output.

6. **Notification Permissions & Emergency Helplines**:
   - Top notification prompt requesting browser alert permissions.
   - Emergency popup dialog displaying direct helpline numbers (*NDRF: 1077 / 112*, *Dam Control Room: +91 98765 43210*).

### How to Run the Client App

- **Option A (Served via Backend)**: Start the server and navigate to:
  ```
  http://localhost:5001/client/
  ```
- **Option B (Standalone / Direct)**: Open `client side/index.html` directly in any modern web browser.

---

## Design Standards & Compliance

- **Aesthetic**: Grounded dark industrial theme in Cerulean (`#0ea5e9`), Slate (`#111827`), and standard operational indicators.
- **Component Geometry**: Clean rectangular elements with subtle 4px to 6px border radii (zero pill buttons).
- **Icons**: 100% inline vector SVGs (zero emoji icons).
- **Typography**: Clear, standard punctuation (zero em dashes).
- **Legal Compliance**: Dedicated [Privacy Policy](client%20side/privacy.html) and [Terms & Conditions](client%20side/terms.html) pages included on both portals.
