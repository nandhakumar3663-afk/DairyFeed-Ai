
# 🌱 SMART FEED & SILAGE QUALITY ANALYZER
### Smart AI-Enabled Rapid Feed and Silage Quality Testing System for Dairy Farmers
**Domain:** Precision Dairy Nutrition & Quality Assurance  
**Category:** Production AI + IoT Multi-Sensor Platform

---

## 📌 Executive Summary
High-quality cattle feed and silage are the backbone of sustainable dairy farming in India. Silage spoilage, mold/aflatoxins, and improper chop length cause a **20% to 30% drop in milk yield, metabolic acidosis (SARA), and reproductive loss**, costing dairy farmers thousands of rupees every season. 

Traditional laboratory chemical testing (Kjeldahl digestion, bomb calorimetry) requires **5 to 10 days** and costs **₹1,500 - ₹3,000 per sample**, making routine testing inaccessible to smallholder farmers.

**Smart Feed & Silage Quality Analyzer** is an end-to-end AI + IoT precision dairy nutrition platform that provides **sub-second rapid quality inference** using multi-sensor probe telemetry, 6-band optical Near-Infrared (NIR) reflectance, and computer vision.

---

## 🚀 Key Modules & Capabilities

### 1. Real-Time IoT Telemetry & Hardware Dual-Mode
- **Hardware Integration:** Production ESP32 firmware node connects to:
  - **DS18B20 1-Wire Digital Probe Array:** Multi-depth core, surface, and base silo temperature monitoring.
  - **DFRobot Industrial Analog pH Probe:** Direct silage fermentation acidity testing.
  - **DHT22 / SHT31 Sensor:** Headspace relative humidity and moisture content.
  - **MQ-135 Gas Sensor:** Ammonia ($NH_3$) and volatile organic compound (VOC) emissions for proteolysis detection.
  - **AS7262 6-Band Visible-NIR Sensor:** Optical spectrometry across 450nm - 650nm wavelengths.
- **Dual Mode Toggle:** Seamlessly toggle between **Live ESP32 Hardware Stream** and high-fidelity **Simulation Mode**.
- **Early Warning Aerobic Spoilage Simulation:** Demonstrates how air leaks trigger instant heat accumulation ($>36^\circ\text{C}$) and butyric spoilage before total silo loss occurs.

### 2. AI Fermentation & Nutritional Proximate Matrix
- **Flieg's Silage Fermentation Score (0-100):** Evaluates lactic acid vs butyric acid fermentation quality according to ICAR and DLG standards.
- **Rapid Nutritional Inference:**
  - Dry Matter (DM %)
  - Crude Protein (CP %)
  - Total Digestible Nutrients (TDN %)
  - Acid Detergent Fiber (ADF %) & Neutral Detergent Fiber (NDF %)
  - Net Energy for Lactation ($NE_L$ Mcal/kg)
  - Mold & Aflatoxin B1 Hazard Risk Index (%)

### 3. AI Computer Vision & Penn State Particle Sieve (PSPS)
- Analyzes forage cut length and physical effective NDF (peNDF) to prevent Sub-Acute Ruminal Acidosis (SARA):
  - Upper Sieve (> 19 mm)
  - Middle Sieve (8 - 19 mm)
  - Lower Sieve (1.18 - 8 mm)
  - Bottom Pan (< 1.18 mm fines)
- Computer vision detection of fungal mold hyphae (*Aspergillus* / *Penicillium*).

### 4. ICAR-Compliant Dairy Cattle Ration Balancer
- Matches cow/buffalo breed (Indigenous Gir/Sahiwal, Crossbred HF/Jersey, Murrah Buffalo), body weight, and milk yield with tested silage composition.
- Formulates optimal daily feeding (Silage + Green Fodder + Dry Straw + Compound Concentrate + Minerals + Water).
- **Economic Impact:** Saves ₹15 - ₹35 per cow/day by eliminating concentrate feed over-purchase (up to ₹54,000 - ₹1,20,000/year for a 10-cow herd).

### 5. Multilingual Accessibility & Voice AI Assistant
- Supports **English, हिन्दी (Hindi), தமிழ் (Tamil), ਪੰਜਾਬੀ (Punjabi), and मराठी (Marathi)**.
- Integrated Web Speech API audio advisory for rural dairy farmers.
- One-click WhatsApp / SMS ration plan sharing.

### 6. Dairy Cooperative Union & NDDB Procurement Portal
- Village Milk Producers Cooperative Society (MPCS) fleet monitoring.
- Silage quality ranking and milk procurement incentive disbursement (+₹1.50/L bonus).

### 7. Official Lab-Grade Certificate of Analysis (PDF)
- Generate, view, and print/save standard testing certificates with QR code verification and ICAR benchmark comparisons.

---

## 🛠️ Project Architecture

```
DairyFeed-Ai/
├── dev-runner.js                # Concurrent runner for server & client
├── package.json                 # Root orchestration package
├── server/                      # Node.js Express + WebSocket IoT Hub
│   ├── server.js                # REST API & WebSocket broadcast server (:5001)
│   ├── firmware/
│   │   └── esp32_silage_node.ino # Complete Arduino C++ firmware sketch
│   └── services/
│       ├── silageAnalytics.js   # Flieg score & proximate regression models
│       ├── rationOptimizer.js   # ICAR cattle nutrient balancing algorithm
│       ├── visionClassifier.js  # Penn State Particle Separator classifier
│       └── telemetrySimulator.js# Sensor kinetics & microbial heating simulator
└── client/                      # React + Vite Frontend (:3000)
    ├── src/
    │   ├── App.jsx              # Main dashboard application
    │   ├── index.css            # Dark glassmorphic design system
    │   ├── translations.js      # English, Hindi, Tamil, Punjabi, Marathi
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── LiveTelemetry.jsx
    │   │   ├── SilageAnalytics.jsx
    │   │   ├── VisualScanner.jsx
    │   │   ├── RationBalancer.jsx
    │   │   ├── SiloFleetManager.jsx
    │   │   ├── CooperativePortal.jsx
    │   │   ├── HardwareDocs.jsx
    │   │   └── CertificateModal.jsx
    │   └── services/
    │       ├── api.js           # REST & WebSocket client with auto-reconnect
    │       ├── audioSpeech.js   # Vernacular voice advisory
    │       └── simulator.js     # Client-side fallback kinetics engine
```

---

## ⚡ Quick Start Guide

### 1. Install Dependencies
```bash
# In project root:
npm install --prefix client
npm install --prefix server
```

### 2. Start Full-Stack Application
```bash
# Starts both Backend (:5001) and Frontend (:3000)
node dev-runner.js
```
Open **http://localhost:3000** in your browser.

---

## 📡 Hardware REST & Telemetry Endpoints

- `GET /api/v1/health` - Server health check & client count
- `GET /api/v1/sensors/latest` - Latest readings across all silos
- `GET /api/v1/sensors/history?pit=pit-a` - Chronological telemetry stream
- `POST /api/v1/sensors/telemetry` - Real ESP32 JSON ingestion endpoint:
  ```json
  {
    "deviceId": "ESP32-SILO-01",
    "pitId": "pit-a",
    "temperature_core": 25.4,
    "ph_level": 4.02,
    "moisture_pct": 65.5,
    "ammonia_ppm": 15.2,
    "nir_bands": [420, 510, 630, 710, 800, 890]
  }
  ```
- `POST /api/v1/ration/optimize` - ICAR feed ration balancer
- `GET /api/v1/config/firebase` - Firebase & MQTT broker deployment schema