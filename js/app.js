/* ==========================================================================
   SMART DAM MONITORING SYSTEM (DAM MONITOR AI PRO) - CORE SCRIPT
   ========================================================================== */

// --- STATE MANAGEMENT & THRESHOLDS ---
const state = {
  // Telemetry metrics
  waterLevel: 68.5,       // Water Level %
  rainfall: 18.0,         // Rainfall mm
  riseRate: 0.8,          // Rate of Rise %/hr
  sensorStatus: 'ACTIVE',
  batteryLevel: 96,
  gateOpenPercent: 0,     // Spillway Gate Opening %

  // ML Risk Assessment Output
  riskLevel: 'SAFE',      // SAFE, WARNING, HIGH RISK, CRITICAL
  riskProbability: 18,    // 0-100%
  tCriticalHours: null,   // Hours remaining

  // System Config & Thresholds
  thresholds: {
    safeMax: 70.0,
    warningMax: 80.0,
    highMax: 90.0,
    criticalMax: 95.0
  },

  // Audio Siren State
  audioContext: null,
  sirenOscillator: null,
  sirenGain: null,
  isSirenActive: false,

  // Historical Telemetry Store (Simulated MySQL DB)
  history: [],
  alerts: [],
  smsLogs: []
};

// --- CHART INSTANCES ---
let liveChartInstance = null;
let historyChartInstance = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initCharts();
  initNavigation();
  initEventListeners();
  
  // Generate initial historical seed data
  generateInitialHistory();
  
  // Start Telemetry Simulator Loop (Runs every 2 seconds)
  setInterval(runTelemetryCycle, 2000);
});

// --- CLOCK & TIMESTAMP ---
function initClock() {
  const timeElem = document.getElementById('currentTime');
  function updateTime() {
    const now = new Date();
    if (timeElem) {
      timeElem.textContent = now.toLocaleTimeString() + ' | ' + now.toLocaleDateString();
    }
  }
  updateTime();
  setInterval(updateTime, 1000);
}

// --- NAVIGATION HANDLER ---
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      navBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      // Re-render chart if historical tab activated
      if (targetTab === 'tab-history' && historyChartInstance) {
        historyChartInstance.resize();
        updateHistoryChart();
      }
    });
  });
}

// --- TELEMETRY SIMULATOR & CYCLE ---
async function runTelemetryCycle() {
  // 1. Calculate Gate Discharge Effect
  if (state.gateOpenPercent > 0) {
    const dischargeEffect = (state.gateOpenPercent / 100) * 0.45;
    state.waterLevel = Math.max(10, state.waterLevel - dischargeEffect);
  }

  // 2. Add realistic subtle natural fluctuations unless manual override
  const noiseWater = (Math.random() - 0.48) * 0.15;
  state.waterLevel = Math.min(100, Math.max(5, state.waterLevel + noiseWater));
  
  const noiseRain = (Math.random() - 0.5) * 0.3;
  state.rainfall = Math.max(0, state.rainfall + noiseRain);

  // Re-calculate Rate of Rise
  if (state.history.length > 0) {
    const prevWater = state.history[state.history.length - 1].waterLevel;
    // Calculate rate per hour (cycle is 2s = 1/1800 hr simulation scaling)
    state.riseRate = parseFloat(((state.waterLevel - prevWater) * 12).toFixed(2));
  }

  // 3. Post to Flask REST API Backend & run ML inference if connected
  if (typeof isBackendOnline !== 'undefined' && isBackendOnline) {
    const apiRes = await apiPostSensorData(state.waterLevel, state.rainfall, state.riseRate);
    if (apiRes && apiRes.status === 'success') {
      state.riskLevel = apiRes.risk_level;
      state.riskProbability = apiRes.probability;
      state.tCriticalDisplay = apiRes.t_critical;
      state.tCriticalHours = apiRes.t_critical_hours;
    } else {
      evaluateMLPrediction();
    }
  } else {
    // 3b. Fallback Client ML Heuristic Engine
    evaluateMLPrediction();
  }

  // 4. Update Database Store / Memory History
  const timestamp = new Date().toLocaleTimeString();
  const record = {
    time: timestamp,
    waterLevel: parseFloat(state.waterLevel.toFixed(1)),
    rainfall: parseFloat(state.rainfall.toFixed(1)),
    riseRate: parseFloat(state.riseRate.toFixed(2)),
    riskLevel: state.riskLevel,
    riskProbability: state.riskProbability,
    tCritical: state.tCriticalDisplay || (state.tCriticalHours !== null ? state.tCriticalHours.toFixed(1) + 'h' : 'N/A')
  };

  state.history.push(record);
  if (state.history.length > 30) state.history.shift();

  // 5. Check Alert Triggers
  checkAlertTriggers();

  // 6. Refresh UI Dashboard Components
  updateUI();
  updateLiveChart();
}

// --- AI / ML PREDICTION ENGINE (PERSON 2 MODULE) ---
function evaluateMLPrediction() {
  const wl = state.waterLevel;
  const rf = state.rainfall;
  const rr = state.riseRate;

  // ML Feature Weights & Ensemble Risk Scoring
  // Feature 1: Water Level (45% weight)
  const normWl = wl / 100;
  // Feature 2: Rainfall Intensity (25% weight)
  const normRf = Math.min(120, rf) / 120;
  // Feature 3: Rate of Water Rise (30% weight)
  const normRr = Math.max(0, Math.min(10, rr)) / 10;

  const riskScore = (normWl * 0.45) + (normRf * 0.25) + (normRr * 0.30);
  state.riskProbability = Math.min(99, Math.max(5, Math.round(riskScore * 100)));

  // Risk Level Classification Decision Matrix
  if (wl >= state.thresholds.criticalMax || riskScore >= 0.82) {
    state.riskLevel = 'CRITICAL';
  } else if (wl >= state.thresholds.highMax || riskScore >= 0.65) {
    state.riskLevel = 'HIGH RISK';
  } else if (wl >= state.thresholds.warningMax || riskScore >= 0.45) {
    state.riskLevel = 'WARNING';
  } else {
    state.riskLevel = 'SAFE';
  }

  // Time-to-Critical Formula: T_critical = (H_max - h(t)) / (dh/dt)
  const H_max = 100; // Dam capacity %
  if (rr > 0 && wl < H_max) {
    state.tCriticalHours = (H_max - wl) / rr;
  } else {
    state.tCriticalHours = null; // Infinite / Not applicable when receding
  }
}

// --- ALERT TRIGGERS & SIREN MANAGEMENT ---
function checkAlertTriggers() {
  if (state.riskLevel === 'CRITICAL') {
    if (!state.isSirenActive) {
      triggerSiren(true);
      showCriticalDialog();
    }
    logSMSAlert('🔴 CRITICAL FLOOD ALERT: Dam Water Level at ' + state.waterLevel.toFixed(1) + '%. Immediate evacuation ordered for Downstream Sector A.');
  } else if (state.riskLevel === 'HIGH RISK') {
    logSMSAlert('🟠 HIGH RISK WARNING: Water rise rate high (' + state.riseRate.toFixed(2) + '%/hr). Disaster Response Teams alerted.');
  }
}

function logSMSAlert(message) {
  const time = new Date().toLocaleTimeString();
  // Prevent spamming exact duplicate logs
  if (state.smsLogs.length > 0 && state.smsLogs[state.smsLogs.length - 1].msg === message) return;

  const logEntry = { time, msg: message };
  state.smsLogs.push(logEntry);

  const terminalElem = document.getElementById('smsTerminal');
  if (terminalElem) {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `<span class="log-time">[${time}]</span> DISPATCH -> ${message}`;
    terminalElem.appendChild(line);
    terminalElem.scrollTop = terminalElem.scrollHeight;
  }
}

// Web Audio API Emergency Siren Synthesizer
function triggerSiren(enable) {
  state.isSirenActive = enable;
  const sirenBox = document.getElementById('sirenBox');
  
  if (sirenBox) {
    if (enable) sirenBox.classList.add('siren-active');
    else sirenBox.classList.remove('siren-active');
  }

  if (enable) {
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!state.sirenOscillator) {
      const ctx = state.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, ctx.currentTime);

      // Sweeping frequency modulation for realistic emergency siren
      let freq = 700;
      let rising = true;
      setInterval(() => {
        if (!state.isSirenActive) return;
        freq = rising ? freq + 40 : freq - 40;
        if (freq >= 1200) rising = false;
        if (freq <= 600) rising = true;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
      }, 30);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      state.sirenOscillator = osc;
      state.sirenGain = gain;
    }
  } else {
    if (state.sirenOscillator) {
      state.sirenOscillator.stop();
      state.sirenOscillator.disconnect();
      state.sirenOscillator = null;
    }
  }
}

// HTML5 Dialog Light Dismiss & Modal Trigger
function showCriticalDialog() {
  const dialog = document.getElementById('criticalModal');
  if (dialog && !dialog.open) {
    dialog.showModal();
  }
}

function closeCriticalDialog() {
  const dialog = document.getElementById('criticalModal');
  if (dialog) {
    dialog.close();
    triggerSiren(false);
  }
}

// --- UI DASHBOARD UPDATE ---
function updateUI() {
  // 1. Water Level Metric
  document.getElementById('valWaterLevel').textContent = state.waterLevel.toFixed(1);
  const waterBar = document.getElementById('barWaterLevel');
  if (waterBar) {
    waterBar.style.width = state.waterLevel + '%';
    waterBar.style.backgroundColor = state.waterLevel > 80 ? 'var(--risk-critical)' : 'var(--primary)';
  }

  // 2. Rainfall Metric
  document.getElementById('valRainfall').textContent = state.rainfall.toFixed(1);

  // 3. Rise Rate Metric
  document.getElementById('valRiseRate').textContent = (state.riseRate >= 0 ? '+' : '') + state.riseRate.toFixed(2);

  // 4. Dynamic Risk Badge
  const riskBadge = document.getElementById('valRiskBadge');
  if (riskBadge) {
    riskBadge.textContent = state.riskLevel;
    riskBadge.className = 'risk-badge ' + getRiskClass(state.riskLevel);
  }

  // 5. Risk Probability & T_critical
  document.getElementById('valProbability').textContent = state.riskProbability + '%';
  const tCritElem = document.getElementById('valTCritical');
  if (tCritElem) {
    if (state.tCriticalDisplay) {
      tCritElem.textContent = state.tCriticalDisplay;
      tCritElem.style.color = (state.riskLevel === 'CRITICAL' || state.riskLevel === 'HIGH RISK') ? 'var(--risk-critical)' : 'var(--text-main)';
    } else if (state.tCriticalHours !== null && state.tCriticalHours > 0) {
      const hrs = Math.floor(state.tCriticalHours);
      const mins = Math.round((state.tCriticalHours - hrs) * 60);
      tCritElem.textContent = `${hrs}h ${mins}m`;
      tCritElem.style.color = state.tCriticalHours < 2 ? 'var(--risk-critical)' : 'var(--text-main)';
    } else {
      tCritElem.textContent = 'STABLE (∞)';
      tCritElem.style.color = 'var(--risk-safe)';
    }
  }

  // 6. Spillway Gate Display
  document.getElementById('valGateOpen').textContent = state.gateOpenPercent + '%';
  const flowRate = (state.gateOpenPercent * 42.5).toFixed(0);
  document.getElementById('valGateFlow').textContent = flowRate + ' m³/s';

  // 7. Update Prediction Table in ML View
  updateMLPipelineUI();

  // 8. Update History Table
  updateHistoryTable();
}

function getRiskClass(risk) {
  switch (risk) {
    case 'SAFE': return 'safe';
    case 'WARNING': return 'warning';
    case 'HIGH RISK': return 'high';
    case 'CRITICAL': return 'critical';
    default: return 'safe';
  }
}

function updateMLPipelineUI() {
  document.getElementById('mlInputWl').textContent = state.waterLevel.toFixed(1) + '%';
  document.getElementById('mlInputRf').textContent = state.rainfall.toFixed(1) + ' mm';
  document.getElementById('mlInputRr').textContent = state.riseRate.toFixed(2) + ' %/hr';

  document.getElementById('mlOutputRisk').textContent = state.riskLevel;
  document.getElementById('mlOutputProb').textContent = state.riskProbability + '%';
  document.getElementById('mlOutputTcrit').textContent = state.tCriticalHours ? state.tCriticalHours.toFixed(1) + ' hrs' : 'None';
}

function updateHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  const records = state.history.slice(-10).reverse();
  tbody.innerHTML = records.map(r => `
    <tr>
      <td>${r.time}</td>
      <td>${r.waterLevel}%</td>
      <td>${r.rainfall} mm</td>
      <td>${r.riseRate} %/hr</td>
      <td><span class="risk-badge ${getRiskClass(r.riskLevel)}" style="font-size:0.75rem; padding:0.2rem 0.5rem;">${r.riskLevel}</span></td>
      <td>${r.riskProbability}%</td>
      <td>${r.tCritical}</td>
    </tr>
  `).join('');
}

// --- CHART.JS INITIALIZATION & UPDATES ---
function initCharts() {
  // Live Dashboard Dual-Axis Line/Bar Chart
  const liveCtx = document.getElementById('liveChart')?.getContext('2d');
  if (liveCtx) {
    liveChartInstance = new Chart(liveCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Water Level (%)',
            data: [],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            fill: true,
            tension: 0.35,
            yAxisID: 'y'
          },
          {
            label: 'Rainfall (mm)',
            data: [],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.4)',
            type: 'bar',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 100,
            title: { display: true, text: 'Water Level (%)', color: '#38bdf8' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8' }
          },
          y1: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 150,
            title: { display: true, text: 'Rainfall (mm)', color: '#6366f1' },
            grid: { drawOnChartArea: false },
            ticks: { color: '#94a3b8' }
          }
        },
        plugins: {
          legend: { labels: { color: '#f8fafc' } }
        }
      }
    });
  }

  // Analytics History Chart
  const historyCtx = document.getElementById('historyChart')?.getContext('2d');
  if (historyCtx) {
    historyChartInstance = new Chart(historyCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Historical Water Level (%)',
            data: [],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            fill: true,
            tension: 0.2
          },
          {
            label: 'Risk Probability Score (%)',
            data: [],
            borderColor: '#ef4444',
            borderDash: [5, 5],
            fill: false,
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { min: 0, max: 100, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        },
        plugins: { legend: { labels: { color: '#f8fafc' } } }
      }
    });
  }
}

function updateLiveChart() {
  if (!liveChartInstance) return;

  const labels = state.history.map(h => h.time);
  const waterData = state.history.map(h => h.waterLevel);
  const rainData = state.history.map(h => h.rainfall);

  liveChartInstance.data.labels = labels;
  liveChartInstance.data.datasets[0].data = waterData;
  liveChartInstance.data.datasets[1].data = rainData;
  liveChartInstance.update('quiet');
}

function updateHistoryChart() {
  if (!historyChartInstance) return;

  const labels = state.history.map(h => h.time);
  const waterData = state.history.map(h => h.waterLevel);
  const probData = state.history.map(h => h.riskProbability);

  historyChartInstance.data.labels = labels;
  historyChartInstance.data.datasets[0].data = waterData;
  historyChartInstance.data.datasets[1].data = probData;
  historyChartInstance.update();
}

// --- EVENT LISTENERS & CONTROL PANEL ---
function initEventListeners() {
  // Scenario Preset Buttons
  document.getElementById('btnPresetNormal')?.addEventListener('click', () => setScenario(62, 12, 0.4));
  document.getElementById('btnPresetWarning')?.addEventListener('click', () => setScenario(76, 45, 2.1));
  document.getElementById('btnPresetHigh')?.addEventListener('click', () => setScenario(86, 88, 4.2));
  document.getElementById('btnPresetCritical')?.addEventListener('click', () => setScenario(96, 140, 7.8));

  // Range Sliders
  const rangeWl = document.getElementById('rangeWater');
  if (rangeWl) {
    rangeWl.addEventListener('input', (e) => {
      state.waterLevel = parseFloat(e.target.value);
      runTelemetryCycle();
    });
  }

  const rangeRf = document.getElementById('rangeRain');
  if (rangeRf) {
    rangeRf.addEventListener('input', (e) => {
      state.rainfall = parseFloat(e.target.value);
      runTelemetryCycle();
    });
  }

  const rangeGate = document.getElementById('rangeGate');
  if (rangeGate) {
    rangeGate.addEventListener('input', (e) => {
      state.gateOpenPercent = parseInt(e.target.value);
      updateUI();
    });
  }

  // Emergency Siren Buttons
  document.getElementById('btnToggleSiren')?.addEventListener('click', () => {
    triggerSiren(!state.isSirenActive);
  });

  document.getElementById('btnCloseModal')?.addEventListener('click', closeCriticalDialog);

  // CSV Export Button
  document.getElementById('btnExportCSV')?.addEventListener('click', exportCSVData);

  // Threshold Form Inputs
  document.getElementById('btnSaveThresholds')?.addEventListener('click', () => {
    state.thresholds.warningMax = parseFloat(document.getElementById('threshWarning').value) || 80;
    state.thresholds.highMax = parseFloat(document.getElementById('threshHigh').value) || 90;
    state.thresholds.criticalMax = parseFloat(document.getElementById('threshCritical').value) || 95;
    alert('Threshold settings updated successfully!');
    runTelemetryCycle();
  });
}

function setScenario(wl, rf, rr) {
  state.waterLevel = wl;
  state.rainfall = rf;
  state.riseRate = rr;

  const rangeWl = document.getElementById('rangeWater');
  const rangeRf = document.getElementById('rangeRain');
  if (rangeWl) rangeWl.value = wl;
  if (rangeRf) rangeRf.value = rf;

  runTelemetryCycle();
}

function generateInitialHistory() {
  const baseTime = new Date();
  for (let i = 20; i >= 0; i--) {
    const t = new Date(baseTime.getTime() - i * 60000);
    state.history.push({
      time: t.toLocaleTimeString(),
      waterLevel: parseFloat((65 + Math.sin(i) * 3).toFixed(1)),
      rainfall: parseFloat((15 + Math.cos(i) * 4).toFixed(1)),
      riseRate: 0.5,
      riskLevel: 'SAFE',
      riskProbability: 15,
      tCritical: 'N/A'
    });
  }
}

function exportCSVData() {
  let csv = 'Timestamp,Water_Level_Percent,Rainfall_mm,Rise_Rate_Percent_hr,Risk_Level,Risk_Probability,Time_To_Critical\n';
  state.history.forEach(r => {
    csv += `"${r.time}",${r.waterLevel},${r.rainfall},${r.riseRate},"${r.riskLevel}",${r.riskProbability},"${r.tCritical}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dam_monitoring_telemetry_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
