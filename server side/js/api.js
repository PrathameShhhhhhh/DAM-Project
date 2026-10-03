/* ==========================================================================
   RESERVOIR MONITORING SYSTEM - API CLIENT (js/api.js)
   Connects the telemetry dashboard to Flask REST API backend endpoints.
   ========================================================================== */

const API_BASE_URL = window.location.origin.includes('5001') 
  ? window.location.origin 
  : 'http://localhost:5001';

let isBackendOnline = false;

/**
 * Checks backend health and sets connectivity flag.
 */
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    if (response.ok) {
      isBackendOnline = true;
      updateBackendStatusIndicator(true);
      return true;
    }
  } catch (error) {
    isBackendOnline = false;
    updateBackendStatusIndicator(false);
  }
  return false;
}

/**
 * Updates UI status badge to display backend connection state.
 */
function updateBackendStatusIndicator(online) {
  const statusElem = document.getElementById('systemStatus');
  if (statusElem) {
    if (online) {
      statusElem.className = 'status-badge';
      statusElem.style.borderColor = 'var(--status-safe-border)';
      statusElem.style.backgroundColor = 'var(--status-safe-bg)';
      statusElem.style.color = 'var(--status-safe)';
      statusElem.innerHTML = `
        <span class="status-dot" style="background-color: var(--status-safe);"></span>
        <span>FLASK REST API CONNECTED</span>
      `;
    } else {
      statusElem.className = 'status-badge';
      statusElem.style.borderColor = 'var(--border-color)';
      statusElem.style.backgroundColor = 'var(--bg-input)';
      statusElem.style.color = 'var(--text-secondary)';
      statusElem.innerHTML = `
        <span class="status-dot" style="background-color: var(--text-muted);"></span>
        <span>LOCAL TELEMETRY STREAM</span>
      `;
    }
  }
}

/**
 * Sends live sensor telemetry to Flask backend for ML inference & DB storage.
 */
async function apiPostSensorData(waterLevel, rainfall, riseRate) {
  if (!isBackendOnline) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/sensor-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        water_level: waterLevel,
        rainfall: rainfall,
        rise_rate: riseRate
      })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[API Client] Error posting sensor data:', err);
  }
  return null;
}

/**
 * Fetches latest sensor reading and ML prediction from backend.
 */
async function apiFetchCurrentData() {
  if (!isBackendOnline) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/current-data`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[API Client] Error fetching current data:', err);
  }
  return null;
}

/**
 * Fetches historical sensor readings for charts.
 */
async function apiFetchHistory(limit = 30) {
  if (!isBackendOnline) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/history?limit=${limit}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[API Client] Error fetching history:', err);
  }
  return null;
}

/**
 * Fetches stored alerts from database.
 */
async function apiFetchAlerts(limit = 50) {
  if (!isBackendOnline) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts?limit=${limit}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[API Client] Error fetching alerts:', err);
  }
  return null;
}

/**
 * Sends alert to backend.
 */
async function apiPostAlert(riskLevel, alertType, message, zone = 'Downstream Sector A') {
  if (!isBackendOnline) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        risk_level: riskLevel,
        alert_type: alertType,
        message: message,
        zone: zone
      })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[API Client] Error posting alert:', err);
  }
  return null;
}

/**
 * Updates threshold settings on backend DB.
 */
async function apiUpdateThresholds(safeMax, warningMax, highMax, criticalMax) {
  if (!isBackendOnline) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/update-threshold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        safe_max: safeMax,
        warning_max: warningMax,
        high_max: highMax,
        critical_max: criticalMax
      })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[API Client] Error updating thresholds:', err);
  }
  return null;
}

// Auto ping backend health on script load
document.addEventListener('DOMContentLoaded', () => {
  checkBackendHealth();
  // Poll backend status every 10s
  setInterval(checkBackendHealth, 10000);
});
