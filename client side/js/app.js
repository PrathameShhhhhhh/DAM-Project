/* ==========================================================================
   DAM SAFETY COMMUNITY APP - CLIENT LOGIC (app.js)
   Clean, accessible, multi-lingual state management and telemetry monitoring.
   ========================================================================== */

// --- APPLICATION STATE ---
const appState = {
  currentLang: localStorage.getItem('dam_alert_lang') || 'en',
  
  // User Authentication
  currentUser: JSON.parse(localStorage.getItem('dam_alert_user')) || null,
  pendingOtp: null,
  pendingMobile: '',
  pendingName: '',
  authMode: 'signin', // 'signin' or 'signup'
  
  // Telemetry & Safety
  waterLevel: 68.5,
  rainfall: 18.0,
  riseRate: 0.8,
  gateOpen: 0,
  riskLevel: 'SAFE',
  
  // Location & Weather
  locationName: 'Pune / Bhima Basin (Default)',
  rainChance: 65,
  forecastRate: 18.0,
  
  // Toggles & Audio Siren
  sirenEnabled: JSON.parse(localStorage.getItem('dam_alert_siren_enabled') ?? 'true'),
  alertsEnabled: JSON.parse(localStorage.getItem('dam_alert_alerts_enabled') ?? 'true'),
  notificationsAllowed: false,
  
  // Web Audio Context
  audioContext: null,
  sirenOsc: null,
  sirenGain: null,
  isSirenPlaying: false
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initAuthUI();
  initToggleControls();
  initWaterMonitor();
  initLocationWeather();
  initNotificationBanner();
  
  // If user is already authenticated, show dashboard directly
  if (appState.currentUser) {
    showDashboardView();
  } else {
    showAuthView();
  }
});

// --- LANGUAGE & TRANSLATION SYSTEM ---
function initLanguage() {
  const langBtns = document.querySelectorAll('.lang-btn');
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedLang = btn.getAttribute('data-lang');
      setLanguage(selectedLang);
    });
  });

  setLanguage(appState.currentLang);
}

function setLanguage(lang) {
  if (!translations[lang]) lang = 'en';
  appState.currentLang = lang;
  localStorage.setItem('dam_alert_lang', lang);

  // Update active state on language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Translate all DOM elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (translations[lang][key]) {
      elem.textContent = translations[lang][key];
    }
  });

  // Translate placeholders with data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
    const key = elem.getAttribute('data-i18n-placeholder');
    if (translations[lang][key]) {
      elem.setAttribute('placeholder', translations[lang][key]);
    }
  });

  // Refresh dynamic water & weather text for current language
  updateWaterMonitorUI();
  updateWeatherUI();
  updateAuthStatusUI();
}

function t(key) {
  return translations[appState.currentLang]?.[key] || translations['en']?.[key] || key;
}

// --- AUTHENTICATION & REGISTRATION ---
function initAuthUI() {
  const btnSendOtp = document.getElementById('btnSendOtp');
  const btnSubmitAuth = document.getElementById('btnSubmitAuth');
  const switchAuthMode = document.getElementById('switchAuthMode');
  const btnSignOut = document.getElementById('btnSignOut');

  // Switch between Sign In and Sign Up
  switchAuthMode?.addEventListener('click', () => {
    appState.authMode = appState.authMode === 'signin' ? 'signup' : 'signin';
    updateAuthFormMode();
  });

  // Request / Send OTP
  btnSendOtp?.addEventListener('click', handleSendOtp);

  // Submit Authentication
  btnSubmitAuth?.addEventListener('click', handleAuthSubmit);

  // Sign Out
  btnSignOut?.addEventListener('click', () => {
    appState.currentUser = null;
    localStorage.removeItem('dam_alert_user');
    showAuthView();
  });
}

function updateAuthFormMode() {
  const isSignUp = appState.authMode === 'signup';
  const nameGroup = document.getElementById('nameFormGroup');
  const authTitle = document.getElementById('authTitle');
  const authDesc = document.getElementById('authDesc');
  const btnSubmit = document.getElementById('btnSubmitAuth');
  const switchLink = document.getElementById('switchAuthMode');
  const otpPill = document.getElementById('otpPill');

  if (otpPill) otpPill.classList.remove('visible');

  if (isSignUp) {
    if (nameGroup) nameGroup.style.display = 'flex';
    if (authTitle) authTitle.textContent = t('auth_signup_title');
    if (authDesc) authDesc.textContent = t('auth_signup_desc');
    if (btnSubmit) btnSubmit.textContent = t('btn_signup');
    if (switchLink) switchLink.textContent = t('link_have_account');
  } else {
    if (nameGroup) nameGroup.style.display = 'none';
    if (authTitle) authTitle.textContent = t('auth_signin_title');
    if (authDesc) authDesc.textContent = t('auth_signin_desc');
    if (btnSubmit) btnSubmit.textContent = t('btn_signin');
    if (switchLink) switchLink.textContent = t('link_no_account');
  }
}

function handleSendOtp() {
  const mobileInput = document.getElementById('inputMobile');
  const mobile = mobileInput ? mobileInput.value.trim() : '';

  if (!mobile || mobile.length < 10) {
    alert(t('mobile_invalid'));
    return;
  }

  if (appState.authMode === 'signup') {
    const nameInput = document.getElementById('inputName');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      alert(t('name_required'));
      return;
    }
    appState.pendingName = name;
  }

  appState.pendingMobile = mobile;

  // Generate 4-digit simulation OTP
  const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
  appState.pendingOtp = randomOtp;

  // Show simulation banner
  const otpPill = document.getElementById('otpPill');
  const otpCode = document.getElementById('otpCodeDisplay');
  if (otpPill && otpCode) {
    otpCode.textContent = randomOtp;
    otpPill.classList.add('visible');
  }

  // Pre-fill OTP field for naive user convenience
  const inputOtp = document.getElementById('inputOtp');
  if (inputOtp) inputOtp.value = randomOtp;
}

function handleAuthSubmit() {
  const inputOtp = document.getElementById('inputOtp');
  const enteredOtp = inputOtp ? inputOtp.value.trim() : '';

  if (!enteredOtp || enteredOtp !== appState.pendingOtp) {
    alert(t('otp_invalid'));
    return;
  }

  const user = {
    name: appState.authMode === 'signup' ? appState.pendingName : (localStorage.getItem('saved_user_name_' + appState.pendingMobile) || 'Citizen Operator'),
    mobile: appState.pendingMobile,
    registeredAt: new Date().toISOString()
  };

  if (appState.authMode === 'signup') {
    localStorage.setItem('saved_user_name_' + appState.pendingMobile, appState.pendingName);
  }

  appState.currentUser = user;
  localStorage.setItem('dam_alert_user', JSON.stringify(user));

  showDashboardView();
}

function showAuthView() {
  const authSection = document.getElementById('authSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const profileBadge = document.getElementById('userProfileBadge');

  if (authSection) authSection.classList.add('active');
  if (dashboardSection) dashboardSection.classList.remove('active');
  if (profileBadge) profileBadge.classList.remove('visible');

  updateAuthFormMode();
}

function showDashboardView() {
  const authSection = document.getElementById('authSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const profileBadge = document.getElementById('userProfileBadge');
  const userNameElem = document.getElementById('displayUserName');

  if (authSection) authSection.classList.remove('active');
  if (dashboardSection) dashboardSection.classList.add('active');
  if (profileBadge) profileBadge.classList.add('visible');
  if (userNameElem && appState.currentUser) {
    userNameElem.textContent = appState.currentUser.name;
  }

  updateWaterMonitorUI();
}

function updateAuthStatusUI() {
  const userNameElem = document.getElementById('displayUserName');
  if (userNameElem && appState.currentUser) {
    userNameElem.textContent = appState.currentUser.name;
  }
}

// --- NOTIFICATION BANNER & PERMISSIONS ---
function initNotificationBanner() {
  const btnEnable = document.getElementById('btnEnableNotifications');
  const noticeBanner = document.getElementById('noticeBanner');

  if ('Notification' in window && Notification.permission === 'granted') {
    appState.notificationsAllowed = true;
    if (noticeBanner) noticeBanner.style.display = 'none';
  }

  btnEnable?.addEventListener('click', async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        appState.notificationsAllowed = true;
        btnEnable.textContent = t('notifications_enabled');
        btnEnable.classList.remove('btn-primary');
        btnEnable.classList.add('btn-outline');
        setTimeout(() => {
          if (noticeBanner) noticeBanner.style.display = 'none';
        }, 1200);
      }
    } else {
      alert('Screen notifications enabled in app state.');
    }
  });
}

// --- LIVE WATER LEVEL MONITOR ---
function initWaterMonitor() {
  // Try fetching from Flask REST API if online, else simulate telemetry
  setInterval(fetchLiveTelemetry, 2500);
}

async function fetchLiveTelemetry() {
  try {
    const res = await fetch('http://localhost:5001/api/current-data');
    if (res.ok) {
      const data = await res.json();
      if (data && data.water_level !== undefined) {
        appState.waterLevel = data.water_level;
        appState.rainfall = data.rainfall || appState.rainfall;
        appState.riseRate = data.rise_rate || appState.riseRate;
        appState.riskLevel = data.prediction?.risk_level || 'SAFE';
        updateWaterMonitorUI();
        checkEmergencyPopupTrigger();
        return;
      }
    }
  } catch (e) {
    // Standalone fallback simulation
  }

  // Realistic natural fluctuation for standalone prototype
  const delta = (Math.random() - 0.48) * 0.15;
  appState.waterLevel = Math.min(100, Math.max(10, appState.waterLevel + delta));
  
  if (appState.waterLevel >= 95) appState.riskLevel = 'CRITICAL';
  else if (appState.waterLevel >= 80) appState.riskLevel = 'WARNING';
  else appState.riskLevel = 'SAFE';

  updateWaterMonitorUI();
  checkEmergencyPopupTrigger();
}

function updateWaterMonitorUI() {
  const card = document.getElementById('waterMonitorCard');
  const valDisplay = document.getElementById('waterPercentDisplay');
  const barDisplay = document.getElementById('waterProgressBar');
  const badgeDisplay = document.getElementById('waterStatusBadge');
  const advisoryDisplay = document.getElementById('communityAdvisory');
  const inflowDisplay = document.getElementById('waterInflowDisplay');
  const gateDisplay = document.getElementById('waterGateDisplay');

  if (valDisplay) valDisplay.textContent = appState.waterLevel.toFixed(1) + '%';
  if (barDisplay) {
    barDisplay.style.width = appState.waterLevel + '%';
  }

  if (inflowDisplay) {
    inflowDisplay.textContent = (appState.riseRate >= 0 ? '+' : '') + appState.riseRate.toFixed(2) + ' %/hr';
  }

  if (gateDisplay) {
    gateDisplay.textContent = appState.gateOpen > 0 ? t('gate_discharging') : t('gate_closed');
  }

  // Visual status & advisory coloring
  if (appState.waterLevel >= 95 || appState.riskLevel === 'CRITICAL') {
    if (card) {
      card.className = 'card water-monitor-card status-danger';
    }
    if (barDisplay) barDisplay.style.backgroundColor = 'var(--status-danger)';
    if (badgeDisplay) {
      badgeDisplay.className = 'water-status-badge danger';
      badgeDisplay.textContent = t('status_danger');
    }
    if (advisoryDisplay) advisoryDisplay.textContent = t('advisory_danger');
  } else if (appState.waterLevel >= 80 || appState.riskLevel === 'WARNING') {
    if (card) {
      card.className = 'card water-monitor-card status-warning';
    }
    if (barDisplay) barDisplay.style.backgroundColor = 'var(--status-warning)';
    if (badgeDisplay) {
      badgeDisplay.className = 'water-status-badge warning';
      badgeDisplay.textContent = t('status_warning');
    }
    if (advisoryDisplay) advisoryDisplay.textContent = t('advisory_warning');
  } else {
    if (card) {
      card.className = 'card water-monitor-card status-safe';
    }
    if (barDisplay) barDisplay.style.backgroundColor = 'var(--status-safe)';
    if (badgeDisplay) {
      badgeDisplay.className = 'water-status-badge safe';
      badgeDisplay.textContent = t('status_safe');
    }
    if (advisoryDisplay) advisoryDisplay.textContent = t('advisory_safe');
  }
}

// --- LOCATION-BASED RAINFALL PREDICTION ---
function initLocationWeather() {
  const btnDetect = document.getElementById('btnDetectLocation');
  btnDetect?.addEventListener('click', handleDetectLocation);
}

function handleDetectLocation() {
  const locationText = document.getElementById('currentLocationText');
  const btnDetect = document.getElementById('btnDetectLocation');

  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }

  if (btnDetect) btnDetect.textContent = t('locating');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(2);
      const lon = position.coords.longitude.toFixed(2);

      // Smart regional identification for Maharashtra dam catchment zones
      let region = `Lat: ${lat}, Lon: ${lon} (Local Catchment Zone)`;
      if (lat >= 18.3 && lat <= 18.8 && lon >= 73.6 && lon <= 74.1) {
        region = 'Pune / Khadakwasla Basin';
      } else if (lat >= 19.8 && lat <= 20.2 && lon >= 73.6 && lon <= 74.0) {
        region = 'Nashik / Godavari Basin';
      } else if (lat >= 16.5 && lat <= 17.0 && lon >= 74.0 && lon <= 74.5) {
        region = 'Kolhapur / Panchganga Basin';
      } else if (lat >= 18.8 && lat <= 19.3 && lon >= 72.7 && lon <= 73.2) {
        region = 'Mumbai / Vaitarna Catchment';
      }

      appState.locationName = region;
      appState.rainChance = Math.min(95, Math.max(30, Math.round(appState.rainfall * 3 + 20)));
      appState.forecastRate = parseFloat(appState.rainfall.toFixed(1));

      if (locationText) locationText.textContent = region;
      if (btnDetect) btnDetect.textContent = t('detect_location');
      updateWeatherUI();
    },
    (err) => {
      console.warn('Geolocation error:', err);
      if (btnDetect) btnDetect.textContent = t('detect_location');
      alert('Could not fetch precise location. Using default regional catchment monitor.');
    }
  );
}

function updateWeatherUI() {
  const locationText = document.getElementById('currentLocationText');
  const rainChanceVal = document.getElementById('forecastRainChance');
  const precipVal = document.getElementById('forecastPrecipitation');
  const hazardVal = document.getElementById('forecastHazard');

  if (locationText) locationText.textContent = appState.locationName;
  if (rainChanceVal) rainChanceVal.textContent = appState.rainChance + '%';
  if (precipVal) precipVal.textContent = appState.forecastRate + ' mm/hr';
  
  if (hazardVal) {
    if (appState.forecastRate > 60 || appState.waterLevel > 90) {
      hazardVal.textContent = t('risk_severe');
      hazardVal.style.color = 'var(--status-danger)';
    } else if (appState.forecastRate > 25 || appState.waterLevel > 75) {
      hazardVal.textContent = t('risk_moderate');
      hazardVal.style.color = 'var(--status-warning)';
    } else {
      hazardVal.textContent = t('risk_low');
      hazardVal.style.color = 'var(--status-safe)';
    }
  }
}

// --- SIREN & ALERT SWITCH CONTROLS ---
function initToggleControls() {
  const toggleSiren = document.getElementById('toggleSirenSwitch');
  const toggleAlerts = document.getElementById('toggleAlertsSwitch');
  const btnTestSiren = document.getElementById('btnTestAudioSiren');
  const btnCloseEmergency = document.getElementById('btnCloseEmergencyModal');

  if (toggleSiren) {
    toggleSiren.checked = appState.sirenEnabled;
    toggleSiren.addEventListener('change', (e) => {
      appState.sirenEnabled = e.target.checked;
      localStorage.setItem('dam_alert_siren_enabled', JSON.stringify(appState.sirenEnabled));
      if (!appState.sirenEnabled && appState.isSirenPlaying) {
        stopAudioSiren();
      }
    });
  }

  if (toggleAlerts) {
    toggleAlerts.checked = appState.alertsEnabled;
    toggleAlerts.addEventListener('change', (e) => {
      appState.alertsEnabled = e.target.checked;
      localStorage.setItem('dam_alert_alerts_enabled', JSON.stringify(appState.alertsEnabled));
    });
  }

  btnTestSiren?.addEventListener('click', () => {
    if (appState.isSirenPlaying) {
      stopAudioSiren();
      btnTestSiren.textContent = t('btn_test_siren');
      btnTestSiren.classList.remove('btn-danger');
      btnTestSiren.classList.add('btn-outline');
    } else {
      playAudioSiren();
      btnTestSiren.textContent = t('btn_stop_siren');
      btnTestSiren.classList.remove('btn-outline');
      btnTestSiren.classList.add('btn-danger');
    }
  });

  btnCloseEmergency?.addEventListener('click', () => {
    const dialog = document.getElementById('emergencyDialog');
    if (dialog) dialog.close();
    stopAudioSiren();
  });
}

// Web Audio API Sweeping Siren Synthesizer
function playAudioSiren() {
  if (!appState.sirenEnabled) return;

  if (!appState.audioContext) {
    appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (!appState.sirenOsc) {
    const ctx = appState.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, ctx.currentTime);

    let freq = 650;
    let rising = true;
    const sweep = setInterval(() => {
      if (!appState.isSirenPlaying) {
        clearInterval(sweep);
        return;
      }
      freq = rising ? freq + 35 : freq - 35;
      if (freq >= 1150) rising = false;
      if (freq <= 550) rising = true;
      try {
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
      } catch (e) {
        clearInterval(sweep);
      }
    }, 30);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    appState.sirenOsc = osc;
    appState.sirenGain = gain;
    appState.isSirenPlaying = true;
  }
}

function stopAudioSiren() {
  if (appState.sirenOsc) {
    try {
      appState.sirenOsc.stop();
      appState.sirenOsc.disconnect();
    } catch (e) {}
    appState.sirenOsc = null;
  }
  appState.isSirenPlaying = false;
}

// Emergency Popup Trigger
function checkEmergencyPopupTrigger() {
  if (appState.riskLevel === 'CRITICAL' && appState.alertsEnabled) {
    const dialog = document.getElementById('emergencyDialog');
    if (dialog && !dialog.open) {
      dialog.showModal();
      if (appState.sirenEnabled) {
        playAudioSiren();
      }
    }
  }
}
