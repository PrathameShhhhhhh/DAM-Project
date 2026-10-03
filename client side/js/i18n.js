/* ==========================================================================
   DAM SAFETY COMMUNITY APP - MULTILINGUAL LOCALIZATION (i18n.js)
   Supported Languages: English (en), Hindi (hi), Marathi (mr)
   ========================================================================== */

const translations = {
  en: {
    // Header & App Info
    app_title: "DAM ALERT",
    app_badge: "COMMUNITY",
    user_greeting: "Welcome, ",
    sign_out: "Sign Out",
    
    // Notification Banner
    notice_title: "Enable Emergency Alerts & Siren",
    notice_desc: "Receive instant acoustic siren sounds and popups during reservoir overflow risks.",
    btn_enable_notifications: "Enable Alerts",
    notifications_enabled: "Alerts Enabled",

    // Auth Section
    auth_signin_title: "Citizen Sign In",
    auth_signin_desc: "Enter your registered mobile number and OTP to view live flood alerts.",
    auth_signup_title: "Register for Dam Alerts",
    auth_signup_desc: "Create an account to receive localized flood warnings and emergency alerts.",
    
    label_full_name: "Full Name",
    placeholder_name: "e.g. Rahul Patil",
    label_mobile: "Mobile Number",
    placeholder_mobile: "10-digit mobile number",
    label_otp: "Verification OTP",
    placeholder_otp: "Enter 4-digit OTP",
    
    btn_send_otp: "Send OTP",
    btn_resend_otp: "Resend",
    btn_signin: "Sign In to Dashboard",
    btn_signup: "Complete Registration",
    
    link_no_account: "New user? Create an account",
    link_have_account: "Already registered? Sign in here",
    
    otp_sent_notice: "Simulated OTP sent: ",
    otp_invalid: "Please enter a valid 4-digit OTP.",
    name_required: "Please enter your name.",
    mobile_invalid: "Please enter a valid 10-digit mobile number.",

    // Dashboard - Live Water Monitor
    sec_water_title: "Live Reservoir Water Level",
    water_capacity_label: "Reservoir Full Capacity:",
    water_inflow_label: "Current Inflow Rate:",
    water_gate_label: "Spillway Gate Status:",
    gate_closed: "Closed (0%)",
    gate_discharging: "Discharging Volume",
    
    status_safe: "SAFE",
    status_warning: "MODERATE ALERT",
    status_danger: "CRITICAL DANGER",
    
    advisory_safe: "Advisory: Reservoir water level is normal. Downstream river banks and roads are safe for travel.",
    advisory_warning: "Advisory: Water level is rising due to catchment rainfall. Avoid river bank areas and stay updated.",
    advisory_danger: "Emergency Advisory: Dam water level has exceeded safety limits! Move to elevated safe zones immediately.",

    // Dashboard - Location Rainfall
    sec_rainfall_title: "Local Rainfall & Weather Prediction",
    detect_location: "Detect Location",
    locating: "Locating...",
    location_label: "Monitored Region:",
    
    forecast_rain_chance: "Rain Probability (24h)",
    forecast_precipitation: "Expected Rainfall Rate",
    forecast_flood_risk: "Localized Flood Hazard",
    
    risk_low: "Low / Normal",
    risk_moderate: "Moderate Inflow",
    risk_severe: "Severe Surge Warning",

    // Dashboard - Siren & Alert Switches
    sec_controls_title: "Emergency Siren & Alert Controls",
    switch_siren_title: "Acoustic Emergency Siren",
    switch_siren_desc: "Plays loud sweeping audio siren on your device during critical dam overflow alerts.",
    switch_alerts_title: "Screen Notification Alerts",
    switch_alerts_desc: "Displays urgent popup warning messages and evacuation instructions.",
    btn_test_siren: "Test Audio Siren",
    btn_stop_siren: "Stop Siren",

    // Emergency Modal
    modal_title: "CRITICAL DAM OVERRUN ALERT",
    modal_desc: "Reservoir water level has crossed critical safety thresholds. Immediate flood warning issued for downstream sectors.",
    helpline_title: "Emergency Helplines:",
    helpline_ndrf: "Disaster Response: 1077 / 112",
    helpline_dam: "Dam Control Room: +91 98765 43210",
    btn_acknowledge: "Acknowledge & Mute Siren",

    // Footer
    footer_text: "Dam Safety & Community Flood Warning System Prototype",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms & Conditions"
  },

  hi: {
    // Header & App Info
    app_title: "बांध सुरक्षा अलर्ट",
    app_badge: "नागरिक सेवा",
    user_greeting: "स्वागत है, ",
    sign_out: "लॉग आउट",
    
    // Notification Banner
    notice_title: "आपातकालीन अलर्ट और सायरन चालू करें",
    notice_desc: "बाढ़ की स्थिति में तुरंत ध्वनि सायरन और अलर्ट प्राप्त करें।",
    btn_enable_notifications: "अलर्ट चालू करें",
    notifications_enabled: "अलर्ट सक्रिय हैं",

    // Auth Section
    auth_signin_title: "नागरिक लॉगिन",
    auth_signin_desc: "लाइव बाढ़ अलर्ट देखने के लिए अपना मोबाइल नंबर और ओटीपी दर्ज करें।",
    auth_signup_title: "नया खाता बनाएं",
    auth_signup_desc: "क्षेत्रीय बाढ़ चेतावनी और आपातकालीन अलर्ट पाने के लिए पंजीकरण करें।",
    
    label_full_name: "पूरा नाम",
    placeholder_name: "जैसे: राहुल पाटिल",
    label_mobile: "मोबाइल नंबर",
    placeholder_mobile: "10 अंकों का मोबाइल नंबर",
    label_otp: "ओटीपी (OTP)",
    placeholder_otp: "4 अंकों का ओटीपी दर्ज करें",
    
    btn_send_otp: "ओटीपी भेजें",
    btn_resend_otp: "पुनः भेजें",
    btn_signin: "डैशबोर्ड में प्रवेश करें",
    btn_signup: "पंजीकरण पूरा करें",
    
    link_no_account: "नया खाता? यहां पंजीकरण करें",
    link_have_account: "पहले से खाता है? लॉगिन करें",
    
    otp_sent_notice: "परीक्षण ओटीपी: ",
    otp_invalid: "कृपया 4 अंकों का सही ओटीपी दर्ज करें।",
    name_required: "कृपया अपना नाम दर्ज करें।",
    mobile_invalid: "कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें।",

    // Dashboard - Live Water Monitor
    sec_water_title: "बांध का जलस्तर (लाइव)",
    water_capacity_label: "कुल बांध क्षमता:",
    water_inflow_label: "वर्तमान पानी आवक दर:",
    water_gate_label: "दरवाजे (स्पिलवे गेट):",
    gate_closed: "बंद (0%)",
    gate_discharging: "पानी छोड़ा जा रहा है",
    
    status_safe: "सुरक्षित",
    status_warning: "सतर्कता अलर्ट",
    status_danger: "गंभीर खतरा",
    
    advisory_safe: "सलाह: बांध का जलस्तर सामान्य सीमा में है। नदी तट और सड़कें सुरक्षित हैं।",
    advisory_warning: "सलाह: बारिश के कारण जलस्तर बढ़ रहा है। नदी किनारे जाने से बचें।",
    advisory_danger: "आपातकालीन चेतावनी: जलस्तर खतरे के निशान से ऊपर है! तुरंत ऊंचे और सुरक्षित स्थानों पर जाएं।",

    // Dashboard - Location Rainfall
    sec_rainfall_title: "स्थानीय वर्षा और मौसम का पूर्वानुमान",
    detect_location: "स्थान का पता लगाएं",
    locating: "स्थान खोज रहे हैं...",
    location_label: "निगरानी क्षेत्र:",
    
    forecast_rain_chance: "बारिश की संभावना (24 घंटे)",
    forecast_precipitation: "अनुमानित वर्षा दर",
    forecast_flood_risk: "स्थानीय बाढ़ जोखिम",
    
    risk_low: "कम / सामान्य",
    risk_moderate: "मध्यम आवक",
    risk_severe: "गंभीर बाढ़ चेतावनी",

    // Dashboard - Siren & Alert Switches
    sec_controls_title: "आपातकालीन सायरन और अलर्ट स्विच",
    switch_siren_title: "ध्वनि आपातकालीन सायरन",
    switch_siren_desc: "खतरे की स्थिति में आपके फोन पर तेज सायरन की आवाज बजाता है।",
    switch_alerts_title: "स्क्रीन पॉपअप अलर्ट",
    switch_alerts_desc: "स्क्रीन पर जरूरी चेतावनी और निकासी निर्देश दिखाता है।",
    btn_test_siren: "सायरन टेस्ट करें",
    btn_stop_siren: "सायरन बंद करें",

    // Emergency Modal
    modal_title: "गंभीर बाढ़ चेतावनी",
    modal_desc: "बांध का जलस्तर खतरे के निशान से ऊपर पहुंच गया है। निचले इलाकों के लिए तत्काल बाढ़ चेतावनी जारी की गई है।",
    helpline_title: "आपातकालीन हेल्पलाइन:",
    helpline_ndrf: "आपदा प्रबंधन: 1077 / 112",
    helpline_dam: "बांध नियंत्रण कक्ष: +91 98765 43210",
    btn_acknowledge: "चेतावनी स्वीकार करें और सायरन बंद करें",

    // Footer
    footer_text: "बांध सुरक्षा और नागरिक बाढ़ चेतावनी प्रणाली प्रोटोटाइप",
    footer_privacy: "गोपनीयता नीति",
    footer_terms: "नियम और शर्तें"
  },

  mr: {
    // Header & App Info
    app_title: "धरण सुरक्षा अलर्ट",
    app_badge: "नागरिक सेवा",
    user_greeting: "स्वागत आहे, ",
    sign_out: "बाहेर पडा",
    
    // Notification Banner
    notice_title: "तातडीचे अलर्ट आणि सायरन सुरू करा",
    notice_desc: "पूर परिस्थितीमध्ये त्वरित सायरन आवाज आणि सूचना प्राप्त करा.",
    btn_enable_notifications: "अलर्ट सुरू करा",
    notifications_enabled: "अलर्ट सुरू आहेत",

    // Auth Section
    auth_signin_title: "नागरिक लॉगिन",
    auth_signin_desc: "थेट पूर अलर्ट पाहण्यासाठी आपला मोबाईल क्रमांक आणि ओटीपी टाका.",
    auth_signup_title: "नवीन खाते तयार करा",
    auth_signup_desc: "स्थानिक पूर इशारे आणि तातडीच्या सूचना मिळवण्यासाठी नोंदणी करा.",
    
    label_full_name: "पूर्ण नाव",
    placeholder_name: "उदा. राहुल पाटील",
    label_mobile: "मोबाईल क्रमांक",
    placeholder_mobile: "१० अंकी मोबाईल नंबर",
    label_otp: "ओटीपी (OTP)",
    placeholder_otp: "४ अंकी ओटीपी टाका",
    
    btn_send_otp: "ओटीपी पाठवा",
    btn_resend_otp: "पुन्हा पाठवा",
    btn_signin: "डॅशबोर्डमध्ये जा",
    btn_signup: "नोंदणी पूर्ण करा",
    
    link_no_account: "नवीन वापरकर्ता? नोंदणी करा",
    link_have_account: "आधीच नोंदणी केली आहे? लॉगिन करा",
    
    otp_sent_notice: "चाचणी ओटीपी: ",
    otp_invalid: "कृपया ४ अंकी वैध ओटीपी टाका.",
    name_required: "कृपया आपले नाव प्रविष्ट करा.",
    mobile_invalid: "कृपया वैध १० अंकी मोबाईल क्रमांक टाका.",

    // Dashboard - Live Water Monitor
    sec_water_title: "धरणातील पाण्याची पातळी (थेट)",
    water_capacity_label: "धरणाची एकूण क्षमता:",
    water_inflow_label: "पाण्याची आवक गती:",
    water_gate_label: "धरणाचे दरवाजे (विसर्ग):",
    gate_closed: "बंद (०%)",
    gate_discharging: "पाणी सोडले जात आहे",
    
    status_safe: "सुरक्षित",
    status_warning: "दक्षता इशारा",
    status_danger: "धोकादायक पातळी",
    
    advisory_safe: "सूचना: धरणातील पाणीसाठा सुरक्षित मर्यादेत आहे. नदीकाठचा परिसर आणि रस्ते सुरक्षित आहेत.",
    advisory_warning: "सूचना: पावसामुळे पाणीसाठ्यात वाढ होत आहे. नदीकाठी जाणे टाळा व सतर्क राहा.",
    advisory_danger: "तातडीचा इशारा: धरणातील पाण्याची पातळी धोक्याच्या पातळीवर पोहोचली आहे! त्वरित सुरक्षित ठिकाणी जा.",

    // Dashboard - Location Rainfall
    sec_rainfall_title: "स्थानिक पाऊस आणि हवामान अंदाज",
    detect_location: "स्थान शोधा",
    locating: "स्थान शोधत आहे...",
    location_label: "निरीक्षण क्षेत्र:",
    
    forecast_rain_chance: "पावसाची शक्यता (२४ तास)",
    forecast_precipitation: "अपेक्षित पाऊस दर",
    forecast_flood_risk: "स्थानिक पूर धोका",
    
    risk_low: "कमी / सामान्य",
    risk_moderate: "मध्यम वाढ",
    risk_severe: "गंभीर पूर इशारा",

    // Dashboard - Siren & Alert Switches
    sec_controls_title: "आणीबाणी सायरन आणि सूचना नियंत्रणे",
    switch_siren_title: "ध्वनी आणीबाणी सायरन",
    switch_siren_desc: "धोक्याच्या वेळी आपल्या मोबाईलवर मोठ्या आवाजात सायरन वाजवतो.",
    switch_alerts_title: "स्क्रीन पॉपअप सूचना",
    switch_alerts_desc: "स्क्रीनवर तातडीचे इशारे आणि सुरक्षित स्थलांतराच्या सूचना दाखवतो.",
    btn_test_siren: "सायरन तपासा",
    btn_stop_siren: "सायरन बंद करा",

    // Emergency Modal
    modal_title: "गंभीर पूर इशारा",
    modal_desc: "धरणातील पाणीसाठा धोक्याच्या पातळीवर पोहोचला आहे. नदीकाठच्या परिसरासाठी त्वरित पूर इशारा जारी करण्यात आला आहे.",
    helpline_title: "आणीबाणी संपर्क क्रमांक:",
    helpline_ndrf: "आपत्ती व्यवस्थापन: १०७७ / ११२",
    helpline_dam: "धरण नियंत्रण कक्ष: +९१ ९८७६५ ४३२१०",
    btn_acknowledge: "इशारा स्वीकारून सायरन बंद करा",

    // Footer
    footer_text: "धरण सुरक्षा आणि नागरिक पूर इशारा प्रणाली प्रोटोटाइप",
    footer_privacy: "गोपनीयता धोरण",
    footer_terms: "नियम व अटी"
  }
};
