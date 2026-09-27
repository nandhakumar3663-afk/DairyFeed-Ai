# Experimental ESP32 node

Copy `config.example.h` to ignored `config.h`. Configure your Wi-Fi, Render HTTPS URL,
device ID, authorized pit ID and per-device bearer token. Supply the appropriate trusted
root CA certificate for your deployed hostname. Firmware must synchronize its clock
before validated TLS connections work; it never disables certificate verification.

Install the ESP32 board support, ArduinoJson 6.x, OneWire, DallasTemperature and
Adafruit DHT sensor library (and its Unified Sensor dependency) in Arduino IDE.
Use DS18B20 on GPIO 4 with the appropriate pull-up and DHT22 on GPIO 15.
The first DS18B20 is the core probe; bind a fixed sensor address before multi-probe use.

Only core temperature, optional headspace relative humidity and signal strength are sent.
Missing temperature causes the packet to be skipped. Missing humidity is omitted.
There is no offline transmission queue. A disconnected device becomes stale in the dashboard.

The previous sketch's pH, ammonia and feed-moisture conversions were uncalibrated.
They have been removed from measured transmission. Relative humidity is NOT feed moisture.
Add these fields only after integrating calibrated sensors or traceable reference measurements.
Spectral intensities are not wavelengths or validated protein measurements.

This sketch has not been compiled with Arduino tooling or validated on physical hardware.
