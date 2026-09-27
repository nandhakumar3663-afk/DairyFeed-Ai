/* DairyFeed experimental sensor node. No feed-safety or nutrient calibration.
 * Copy config.example.h to config.h and configure secrets locally.
 * DS18B20 on GPIO 4; optional DHT22 headspace humidity on GPIO 15.
 */
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <time.h>
#include "config.h"

OneWire oneWire(4);
DallasTemperature temperatures(&oneWire);
DHT humidity(15, DHT22);
unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  temperatures.begin();
  humidity.begin();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
}
void loop() {
  if (millis() - lastSend < 5000) return;
  lastSend = millis();
  if (WiFi.status() != WL_CONNECTED) { WiFi.reconnect(); return; }
  // Certificate validation requires a synchronized clock. Never disable TLS validation.
  if (time(nullptr) < 1700000000) return;
  temperatures.requestTemperatures();
  float core = temperatures.getTempCByIndex(0);
  if (!isfinite(core) || core == DEVICE_DISCONNECTED_C || core == 85.0 || core < -40 || core > 100) {
    Serial.println("Core temperature unavailable; no packet sent."); return;
  }
  StaticJsonDocument<512> packet;
  packet["deviceId"] = DEVICE_ID;
  packet["pitId"] = PIT_ID;
  packet["temperature_core"] = core;
  float relativeHumidity = humidity.readHumidity();
  if (isfinite(relativeHumidity) && relativeHumidity >= 0 && relativeHumidity <= 100) packet["humidity_pct"] = relativeHumidity;
  packet["wifi_rssi"] = WiFi.RSSI();
  // Do not substitute humidity for feed moisture. pH, ammonia, feed moisture and
  // optical channels are intentionally omitted until sensor calibration is available.
  String body;
  serializeJson(packet, body);
  WiFiClientSecure tls;
  tls.setCACert(ROOT_CA_PEM);
  HTTPClient http;
  http.setTimeout(10000);
  if (!http.begin(tls, BACKEND_URL)) return;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);
  int status = http.POST(body);
  Serial.printf("Telemetry response: %d\n", status); // Never print credentials.
  http.end();
}
