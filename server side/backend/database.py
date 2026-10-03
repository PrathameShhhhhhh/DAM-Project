"""
Database Management Layer for Flask Backend (Person 3 Module)
Uses SQLite database (dam_monitor.db) for reliable, zero-config persistence with full SQL semantics.
"""

import os
import sqlite3
from datetime import datetime

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "dam_monitor.db"))

def get_db_connection():
    """Returns a SQLite connection object with Dictionary row factory."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLite database schema and seeds default configuration."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        water_level REAL NOT NULL,
        rainfall REAL NOT NULL,
        rise_rate REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_data_id INTEGER,
        risk_level VARCHAR(20) NOT NULL,
        probability INTEGER NOT NULL,
        t_critical VARCHAR(20),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sensor_data_id) REFERENCES sensor_data(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        risk_level VARCHAR(20) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        zone VARCHAR(50) DEFAULT 'Zone A',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'ACTIVE'
    );

    CREATE TABLE IF NOT EXISTS threshold_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        safe_max REAL DEFAULT 70.0,
        warning_max REAL DEFAULT 80.0,
        high_max REAL DEFAULT 90.0,
        critical_max REAL DEFAULT 95.0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        role VARCHAR(50) DEFAULT 'Operator',
        zone VARCHAR(50) DEFAULT 'Zone A'
    );
    """)

    # Seed threshold settings if empty
    cursor.execute("SELECT COUNT(*) FROM threshold_settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            "INSERT INTO threshold_settings (safe_max, warning_max, high_max, critical_max) VALUES (70.0, 80.0, 90.0, 95.0)"
        )
        print("[DATABASE] Seeded default threshold settings.")

    conn.commit()
    conn.close()
    print(f"[DATABASE] Initialized database at {DB_PATH}")

def save_sensor_reading(water_level, rainfall, rise_rate):
    """Inserts a new sensor reading into DB and returns inserted ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO sensor_data (timestamp, water_level, rainfall, rise_rate) VALUES (?, ?, ?, ?)",
        (now_str, float(water_level), float(rainfall), float(rise_rate))
    )
    sensor_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return sensor_id

def save_prediction(sensor_data_id, risk_level, probability, t_critical):
    """Inserts a new prediction record associated with sensor reading."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO predictions (sensor_data_id, risk_level, probability, t_critical, timestamp) VALUES (?, ?, ?, ?, ?)",
        (sensor_data_id, risk_level, int(probability), str(t_critical), now_str)
    )
    pred_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return pred_id

def get_latest_reading_and_prediction():
    """Fetches the most recent sensor reading joined with its ML prediction."""
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
    SELECT s.id, s.timestamp, s.water_level, s.rainfall, s.rise_rate,
           p.risk_level, p.probability, p.t_critical
    FROM sensor_data s
    LEFT JOIN predictions p ON p.sensor_data_id = s.id
    ORDER BY s.id DESC LIMIT 1
    """
    cursor.execute(query)
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_sensor_history(limit=30):
    """Fetches recent historical readings joined with predictions for charting."""
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
    SELECT s.id, s.timestamp, s.water_level, s.rainfall, s.rise_rate,
           p.risk_level, p.probability, p.t_critical
    FROM sensor_data s
    LEFT JOIN predictions p ON p.sensor_data_id = s.id
    ORDER BY s.id DESC LIMIT ?
    """
    cursor.execute(query, (limit,))
    rows = cursor.fetchall()
    conn.close()
    # Reverse so timeline is chronological (oldest to newest)
    return [dict(r) for r in reversed(rows)]

def save_alert(risk_level, alert_type, message, zone="Downstream Sector A", status="ACTIVE"):
    """Saves alert event into DB."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO alerts (risk_level, alert_type, message, zone, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)",
        (risk_level, alert_type, message, zone, now_str, status)
    )
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return alert_id

def get_alerts(limit=50):
    """Fetches recent alert logs."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_thresholds():
    """Fetches current threshold settings."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT safe_max, warning_max, high_max, critical_max FROM threshold_settings ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return {"safe_max": 70.0, "warning_max": 80.0, "high_max": 90.0, "critical_max": 95.0}

def update_thresholds(safe_max, warning_max, high_max, critical_max):
    """Updates threshold settings."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO threshold_settings (safe_max, warning_max, high_max, critical_max, updated_at) VALUES (?, ?, ?, ?, ?)",
        (float(safe_max), float(warning_max), float(high_max), float(critical_max), now_str)
    )
    conn.commit()
    conn.close()
    return get_thresholds()

if __name__ == "__main__":
    init_db()
