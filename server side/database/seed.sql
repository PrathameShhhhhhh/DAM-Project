-- Seed Data for Dam Monitoring System

INSERT INTO threshold_settings (safe_max, warning_max, high_max, critical_max) 
VALUES (70.0, 80.0, 90.0, 95.0);

INSERT INTO users (name, phone, role, zone) VALUES
('Dam Operation Control Room', '+1-800-555-0199', 'Admin', 'Control Center'),
('Disaster Management Officer', '+1-800-555-0144', 'Safety Officer', 'Downstream Zone A'),
('Emergency Response Lead', '+1-800-555-0177', 'Emergency Responder', 'Sector B');

INSERT INTO alerts (risk_level, alert_type, message, zone, status) VALUES
('SAFE', 'SYSTEM_INITIALIZED', 'Telemetry stream connected and operating nominally.', 'Control Room', 'RESOLVED');
