#pragma once
const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL = "https://YOUR-SERVICE.onrender.com/api/v1/sensors/telemetry";
const char* DEVICE_ID = "ESP32-SILO-01";
const char* PIT_ID = "pit-a";
const char* DEVICE_TOKEN = "REPLACE_WITH_DEVICE_TOKEN_FROM_SERVER_CONFIGURATION";
// Paste the trusted root CA for your deployment's HTTPS certificate chain.
// Never use setInsecure(). Keep this trust anchor current as certificates change.
const char* ROOT_CA_PEM = R"PEM(
-----BEGIN CERTIFICATE-----
REPLACE_WITH_TRUSTED_ROOT_CA
-----END CERTIFICATE-----
)PEM";
