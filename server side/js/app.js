/* ==========================================================================
   RESERVOIR HYDRAULIC & STRUCTURAL TELEMETRY SYSTEM - CORE APPLICATION
   Clean, deterministic telemetry processing and operational control logic.
   ========================================================================== */

// --- STATE MANAGEMENT & THRESHOLDS ---
const state = {
  // Telemetry metrics
  waterLevel: 68.5,       // Water Level %
  rainfall: 18.0,         // Rainfall mm/hr
  riseRate: 0.8,          // Rate of Rise %/hr
  sensorStatus: 'ACTIVE',
  batteryLevel: 96,
  gateOpenPercent: 0,     // Spillway Gate Opening %

  // Risk Assessment Output
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

  // Historical Telemetry Store
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
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
      }

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

  // 2. Add realistic natural fluctuations unless manual override
  const noiseWater = (Math.random() - 0.48) * 0.15;
  state.waterLevel = Math.min(100, Math.max(5, state.waterLevel + noiseWater));
  
  const noiseRain = (Math.random() - 0.5) * 0.3;
  state.rainfall = Math.max(0, state.rainfall + noiseRain);

  // Re-calculate Rate of Rise
  if (state.history.length > 0) {
    const prevWater = state.history[state.history.length - 1].waterLevel;
    state.riseRate = parseFloat(((state.waterLevel - prevWater) * 12).toFixed(2));
  }

  // 3. Post to Flask REST API Backend & run inference if connected
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

// --- RISK ASSESSMENT & INFERENCE ENGINE ---
function evaluateMLPrediction() {
  const wl = state.waterLevel;
  const rf = state.rainfall;
  const rr = state.riseRate;

  // Multi-Sensor Feature Normalization & Weighting
  const normWl = wl / 100;
  const normRf = Math.min(120, rf) / 120;
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
  const H_max = 100;
  if (rr > 0 && wl < H_max) {
    state.tCriticalHours = (H_max - wl) / rr;
  } else {
    state.tCriticalHours = null;
  }
}

// --- ALERT TRIGGERS & SIREN MANAGEMENT ---
function checkAlertTriggers() {
  if (state.riskLevel === 'CRITICAL') {
    if (!state.isSirenActive) {
      triggerSiren(true);
      showCriticalDialog();
    }
    logSMSAlert('[CRITICAL FLOOD ALERT] Reservoir Water Level at ' + state.waterLevel.toFixed(1) + '%. Immediate evacuation protocol initiated for Downstream Sector A.');
  } else if (state.riskLevel === 'HIGH RISK') {
    logSMSAlert('[HIGH RISK WARNING] Water rise rate surging (' + state.riseRate.toFixed(2) + '%/hr). Disaster Response Units alerted.');
  }
}

function logSMSAlert(message) {
  const time = new Date().toLocaleTimeString();
  if (state.smsLogs.length > 0 && state.smsLogs[state.smsLogs.length - 1].msg === message) return;

  const logEntry = { time, msg: message };
  state.smsLogs.push(logEntry);

  const terminalElem = document.getElementById('smsTerminal');
  if (terminalElem) {
    const line = document.createElement('div');
    line.className = 'log-line';
    const tagClass = message.includes('CRITICAL') ? 'log-danger' : (message.includes('WARNING') ? 'log-warn' : 'log-success');
    line.innerHTML = `<span class="log-time">[${time}]</span> <span class="${tagClass}">DISPATCH:</span> ${message}`;
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

      let freq = 700;
      let rising = true;
      const sweepInterval = setInterval(() => {
        if (!state.isSirenActive) {
          clearInterval(sweepInterval);
          return;
        }
        freq = rising ? freq + 40 : freq - 40;
        if (freq >= 1200) rising = false;
        if (freq <= 600) rising = true;
        try {
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
        } catch (e) {
          clearInterval(sweepInterval);
        }
      }, 30);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      state.sirenOscillator = osc;
      state.sirenGain = gain;
    }
  } else {
    if (state.sirenOscillator) {
      try {
        state.sirenOscillator.stop();
        state.sirenOscillator.disconnect();
      } catch (e) {}
      state.sirenOscillator = null;
    }
  }
}

// Dialog Modal Trigger
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
  const valWaterElem = document.getElementById('valWaterLevel');
  if (valWaterElem) valWaterElem.textContent = state.waterLevel.toFixed(1);

  const waterBar = document.getElementById('barWaterLevel');
  if (waterBar) {
    waterBar.style.width = state.waterLevel + '%';
    waterBar.style.backgroundColor = state.waterLevel > 80 ? 'var(--status-critical)' : 'var(--primary)';
  }

  // 2. Rainfall Metric
  const valRainElem = document.getElementById('valRainfall');
  if (valRainElem) valRainElem.textContent = state.rainfall.toFixed(1);

  // 3. Rise Rate Metric
  const valRiseElem = document.getElementById('valRiseRate');
  if (valRiseElem) valRiseElem.textContent = (state.riseRate >= 0 ? '+' : '') + state.riseRate.toFixed(2);

  // 4. Dynamic Risk Badge
  const riskBadge = document.getElementById('valRiskBadge');
  if (riskBadge) {
    riskBadge.textContent = state.riskLevel;
    riskBadge.className = 'risk-badge ' + getRiskClass(state.riskLevel);
  }

  // 5. Risk Probability & T_critical
  const valProbElem = document.getElementById('valProbability');
  if (valProbElem) valProbElem.textContent = state.riskProbability + '%';

  const tCritElem = document.getElementById('valTCritical');
  if (tCritElem) {
    if (state.tCriticalDisplay) {
      tCritElem.textContent = state.tCriticalDisplay;
      tCritElem.style.color = (state.riskLevel === 'CRITICAL' || state.riskLevel === 'HIGH RISK') ? 'var(--status-critical)' : 'var(--text-main)';
    } else if (state.tCriticalHours !== null && state.tCriticalHours > 0) {
      const hrs = Math.floor(state.tCriticalHours);
      const mins = Math.round((state.tCriticalHours - hrs) * 60);
      tCritElem.textContent = `${hrs}h ${mins}m`;
      tCritElem.style.color = state.tCriticalHours < 2 ? 'var(--status-critical)' : 'var(--text-main)';
    } else {
      tCritElem.textContent = 'STABLE';
      tCritElem.style.color = 'var(--status-safe)';
    }
  }

  // 6. Spillway Gate Display
  const valGateElem = document.getElementById('valGateOpen');
  if (valGateElem) valGateElem.textContent = state.gateOpenPercent + '%';

  const flowRate = (state.gateOpenPercent * 42.5).toFixed(0);
  const valFlowElem = document.getElementById('valGateFlow');
  if (valFlowElem) valFlowElem.textContent = flowRate + ' m³/s';

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
  const inWl = document.getElementById('mlInputWl');
  const inRf = document.getElementById('mlInputRf');
  const inRr = document.getElementById('mlInputRr');
  const outRisk = document.getElementById('mlOutputRisk');
  const outProb = document.getElementById('mlOutputProb');
  const outTcrit = document.getElementById('mlOutputTcrit');

  if (inWl) inWl.textContent = state.waterLevel.toFixed(1) + '%';
  if (inRf) inRf.textContent = state.rainfall.toFixed(1) + ' mm/hr';
  if (inRr) inRr.textContent = state.riseRate.toFixed(2) + ' %/hr';

  if (outRisk) outRisk.textContent = state.riskLevel;
  if (outProb) outProb.textContent = state.riskProbability + '%';
  if (outTcrit) outTcrit.textContent = state.tCriticalHours ? state.tCriticalHours.toFixed(1) + ' hrs' : 'Stable';
}

function updateHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  const records = state.history.slice(-10).reverse();
  tbody.innerHTML = records.map(r => `
    <tr>
      <td>${r.time}</td>
      <td>${r.waterLevel}%</td>
      <td>${r.rainfall} mm/hr</td>
      <td>${r.riseRate} %/hr</td>
      <td><span class="risk-badge ${getRiskClass(r.riskLevel)}" style="font-size:0.75rem; padding:0.15rem 0.45rem;">${r.riskLevel}</span></td>
      <td>${r.riskProbability}%</td>
      <td>${r.tCritical}</td>
    </tr>
  `).join('');
}

// --- CHART.JS INITIALIZATION & UPDATES ---
function initCharts() {
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
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            fill: true,
            tension: 0.25,
            borderWidth: 2,
            pointRadius: 2,
            yAxisID: 'y'
          },
          {
            label: 'Rainfall (mm/hr)',
            data: [],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.3)',
            type: 'bar',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } }
          },
          y: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 100,
            title: { display: true, text: 'Water Level (%)', color: '#0ea5e9', font: { weight: '600', size: 11 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } }
          },
          y1: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 150,
            title: { display: true, text: 'Rainfall (mm/hr)', color: '#38bdf8', font: { weight: '600', size: 11 } },
            grid: { drawOnChartArea: false },
            ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } }
          }
        },
        plugins: {
          legend: { labels: { color: '#f8fafc', font: { family: 'Inter', size: 12 } } }
        }
      }
    });
  }

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
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.08)',
            fill: true,
            tension: 0.2,
            borderWidth: 2,
            pointRadius: 2
          },
          {
            label: 'Risk Probability Score (%)',
            data: [],
            borderColor: '#ef4444',
            borderDash: [4, 4],
            fill: false,
            tension: 0.2,
            borderWidth: 2,
            pointRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { min: 0, max: 100, ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
        },
        plugins: { legend: { labels: { color: '#f8fafc', font: { family: 'Inter', size: 12 } } } }
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
  liveChartInstance.update('none');
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
  document.getElementById('btnPresetNormal')?.addEventListener('click', () => setScenario(62, 12, 0.4));
  document.getElementById('btnPresetWarning')?.addEventListener('click', () => setScenario(76, 45, 2.1));
  document.getElementById('btnPresetHigh')?.addEventListener('click', () => setScenario(86, 88, 4.2));
  document.getElementById('btnPresetCritical')?.addEventListener('click', () => setScenario(96, 140, 7.8));

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

  document.getElementById('btnToggleSiren')?.addEventListener('click', () => {
    triggerSiren(!state.isSirenActive);
  });

  document.getElementById('btnCloseModal')?.addEventListener('click', closeCriticalDialog);
  document.getElementById('btnExportCSV')?.addEventListener('click', exportCSVData);

  document.getElementById('btnSaveThresholds')?.addEventListener('click', () => {
    state.thresholds.warningMax = parseFloat(document.getElementById('threshWarning').value) || 80;
    state.thresholds.highMax = parseFloat(document.getElementById('threshHigh').value) || 90;
    state.thresholds.criticalMax = parseFloat(document.getElementById('threshCritical').value) || 95;
    alert('Threshold settings updated successfully.');
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
      tCritical: 'Stable'
    });
  }
}

function exportCSVData() {
  let csv = 'Timestamp,Water_Level_Percent,Rainfall_mm_hr,Rise_Rate_Percent_hr,Risk_Level,Risk_Probability,Time_To_Critical\n';
  state.history.forEach(r => {
    csv += `"${r.time}",${r.waterLevel},${r.rainfall},${r.riseRate},"${r.riskLevel}",${r.riskProbability},"${r.tCritical}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dam_telemetry_audit_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
