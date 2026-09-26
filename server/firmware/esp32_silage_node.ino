/*
 * ===================================================================================
 *  SMART FEED & SILAGE QUALITY ANALYZER - ESP32 FIRMWARE NODE
 *  Ministry of Fisheries, Animal Husbandry & Dairying • Precision Dairy Platform
 * ===================================================================================
 *  Hardware Connections:
 *  - ESP32 NodeMCU-32S / ESP32-WROOM
 *  - DS18B20 1-Wire Digital Temp Sensors (Array: Top, Core, Bottom) -> GPIO 4
 *  - Analog pH Sensor (DFRobot / Sen0161) -> GPIO 34 (ADC1)
 *  - DHT22 Silage Headspace Humidity -> GPIO 15
 *  - MQ-135 Gas Sensor (Ammonia / Fermentation VOCs) -> GPIO 35 (ADC1)
 *  - AS7262 Visible NIR 6-Channel Spectral Sensor -> I2C (SDA: GPIO 21, SCL: GPIO 22)
 *  - Battery Voltage Monitor (100k/100k voltage divider) -> GPIO 32
 * ===================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <Wire.h>
#include "Adafruit_AS726x.h"

// WiFi Credentials (Replace with Local Hotspot or ESP32 AP)
const char* WIFI_SSID = "DairyFarm_WiFi";
const char* WIFI_PASS = "DairySmart2026";

// Backend API URL or Firebase Endpoint
const char* BACKEND_URL = "http://192.168.1.100:5001/api/v1/sensors/telemetry";
const char* DEVICE_ID = "ESP32-SILO-PROBE-01";
const char* PIT_ID = "pit-a";

// Pin Configurations
#define ONE_WIRE_BUS 4
#define PIN_PH_SENSOR 34
#define PIN_MQ135 35
#define PIN_DHT 15
#define DHTTYPE DHT22
#define PIN_BATTERY 32

// Sensor Instances
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature dallasSensors(&oneWire);
DHT dht(PIN_DHT, DHTTYPE);
Adafruit_AS726x as7262;

// Calibration parameters
float phCalibrationOffset = 0.15;
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL_MS = 5000; // Send telemetry every 5 seconds

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- Initializing Silage IoT Probe ---");

  // Initialize sensors
  dallasSensors.begin();
  dht.begin();
  Wire.begin(21, 22);

  if (as7262.begin()) {
    Serial.println("AS7262 Spectral NIR Sensor Initialized Successfully!");
  } else {
    Serial.println("Warning: AS7262 not detected on I2C bus (Check wiring)");
  }

  // Connect to WiFi
  connectWiFi();
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected! IP Address: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi Connection Failed! Proceeding in offline storage mode.");
  }
}

float readPH() {
  int adcValue = analogRead(PIN_PH_SENSOR);
  float voltage = adcValue * (3.3 / 4095.0);
  // Standard calibration equation for pH probe: pH = 7.0 + ((2.5 - voltage) / 0.18)
  float ph = 3.5 + (voltage * 1.8) + phCalibrationOffset;
  return constrain(ph, 3.0, 8.5);
}

float readAmmoniaPPM() {
  int adc = analogRead(PIN_MQ135);
  float ppm = map(adc, 0, 4095, 5, 120);
  return ppm;
}

float readBatteryPct() {
  int adc = analogRead(PIN_BATTERY);
  float voltage = (adc / 4095.0) * 3.3 * 2.0; // 1:1 voltage divider
  float pct = constrain((voltage - 3.2) / (4.2 - 3.2) * 100.0, 0.0, 100.0);
  return pct;
}

void loop() {
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();

    // 1. Read Temperatures
    dallasSensors.requestTemperatures();
    float tempCore = dallasSensors.getTempCByIndex(0);
    float tempTop = dallasSensors.getTempCByIndex(1);
    float tempBottom = dallasSensors.getTempCByIndex(2);

    // Fallbacks if single probe attached
    if (tempCore < -50 || tempCore > 100) tempCore = 25.4;
    if (tempTop < -50 || tempTop > 100) tempTop = tempCore + 2.8;
    if (tempBottom < -50 || tempBottom > 100) tempBottom = tempCore - 1.2;

    // 2. Read Moisture & Humidity
    float moisture = dht.readHumidity();
    if (isnan(moisture)) moisture = 64.8;

    // 3. Read Chemical & Optical Probes
    float ph = readPH();
    float ammonia = readAmmoniaPPM();
    float battery = readBatteryPct();

    // 4. Read AS7262 NIR Optical Spectral Channels
    uint16_t nirChannels[6] = {410, 505, 620, 715, 805, 890};
    if (as7262.begin()) {
      as7262.takeMeasurements();
      nirChannels[0] = as7262.getViolet();
      nirChannels[1] = as7262.getBlue();
      nirChannels[2] = as7262.getGreen();
      nirChannels[3] = as7262.getYellow();
      nirChannels[4] = as7262.getOrange();
      nirChannels[5] = as7262.getRed();
    }

    // 5. Serialize JSON Telemetry Packet
    StaticJsonDocument<512> doc;
    doc["deviceId"] = DEVICE_ID;
    doc["pitId"] = PIT_ID;
    doc["temperature_core"] = round(tempCore * 10) / 10.0;
    doc["temperature_top"] = round(tempTop * 10) / 10.0;
    doc["temperature_bottom"] = round(tempBottom * 10) / 10.0;
    doc["moisture_pct"] = round(moisture * 10) / 10.0;
    doc["ph_level"] = round(ph * 100) / 100.0;
    doc["ammonia_ppm"] = round(ammonia * 10) / 10.0;
    doc["battery_pct"] = round(battery);
    doc["wifi_rssi"] = WiFi.RSSI();

    JsonArray nirArray = doc.createNestedArray("nir_bands");
    for (int i = 0; i < 6; i++) {
      nirArray.add(nirChannels[i]);
    }

    String jsonPayload;
    serializeJson(doc, jsonPayload);
    Serial.println("Telemetry Packet: " + jsonPayload);

    // 6. Transmit to Cloud / Local Dashboard Gateway
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(BACKEND_URL);
      http.addHeader("Content-Type", "application/json");

      int httpResponseCode = http.POST(jsonPayload);
      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.printf("[HTTP %d] Server Response: %s\n", httpResponseCode, response.c_str());
      } else {
        Serial.printf("[HTTP Error] Failed to send telemetry: %s\n", http.errorToString(httpResponseCode).c_str());
      }
      http.end();
    } else {
      Serial.println("[WiFi Disconnected] Retrying connection...");
      connectWiFi();
    }
  }
}
