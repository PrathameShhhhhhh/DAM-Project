-- Smart Dam Safety & Flood Risk AI Monitoring System Schema (Person 3 Module)
-- Compatible with MySQL and SQLite engines

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
