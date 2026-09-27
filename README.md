# DairyFeed — experimental sensor monitoring

DairyFeed is a React dashboard and Node.js gateway for silage sensor telemetry.
**It is an unvalidated prototype, not a laboratory testing service, feed-safety
certificate, aflatoxin detector or accredited nutrition recommendation system.**

## What works

- Explicitly separated **measured** and **simulated** sources. Measurements are never
  modified by the simulator or replaced by browser-generated values during an outage.
- Device bearer authentication with per-device authorized pit IDs; a separate dashboard
  token protects measurement reads and WebSocket subscriptions.
- Strict field/type/range validation before mutation. Missing optional sensors remain missing.
- SQLite transactions, WAL persistence and at most 10,000 readings per location.
- Stale-data labels after 30 seconds without a measurement; source-labelled frozen printable reports.
- One shared browser/API ration calculation with intake limits, infeasibility warnings,
  editable assumed ingredient prices and optional real comparison costs. Negative savings are retained.
- Same-host serving of frontend, API and authenticated WebSocket; reconnect retries and cleanup.
- Automated regression tests and a Render deployment blueprint with persistent disk storage.

## What does not work as a real measurement

Nutrition, fermentation and spoilage indicators are handwritten experimental formulas.
Their outputs are unvalidated estimates, not measured nutrient/toxin concentrations.
Image upload is **preview only**. The image-analysis API returns HTTP 501. There is no
trained model, image-based particle sizing, mold diagnosis, lab accreditation, digital
certificate verification, cooperative payment processing or SMS delivery.

The firmware sends measured core temperature and optional headspace humidity only.
It omits failed and uncalibrated channels. Headspace humidity is not feed moisture.
The sensor sketch has not been compiled or tested on physical ESP32 hardware.
See [firmware setup](server/firmware/README.md).

## Local setup

Requires Node **22.22.1 or newer** with `node:sqlite` support. SQLite may emit an experimental warning on Node 22.

```sh
npm ci --prefix client
npm ci --prefix server
npm run dev
```

Open http://localhost:3000. Simulation works without credentials. Measured routes are
locked until credentials are configured. The dashboard never stores access tokens in localStorage.

For measured data, copy `.env.example` to `.env`, replace both tokens with independently
generated random values, and use two terminals:

```sh
node --env-file=.env server/server.js
npm --prefix client run dev
```

Select **Measured data**, enter `DASHBOARD_TOKEN`, and connect. Configure the device with
`DEVICE_TOKEN`, `DEVICE_ID`, `DEVICE_PIT_ID` and the HTTPS ingestion URL. Do not put device
secrets into frontend build variables, source control, sample reports or shared URLs.
The dashboard token grants all reads for this single-farm deployment; multi-farm accounts
and tenant isolation are not implemented.

For several devices set `DEVICE_CREDENTIALS_FILE` to an ignored JSON file:

```json
{
  "ESP32-SILO-01": {
    "token": "REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS",
    "pitIds": ["pit-a"]
  }
}
```

Credentials are read at startup. Restart after rotation; existing WebSocket sessions close.
Only the deployment operator should have access to credentials and the SQLite volume.

## API

| Route | Authentication / behavior |
| --- | --- |
| `GET /api/v1/health` | Public, no sensitive data |
| `GET /api/v1/sensors/latest?source=measured` | Dashboard bearer token |
| `GET /api/v1/sensors/history?pit=pit-a&source=measured&limit=30` | Dashboard bearer token; limit 1–1000 |
| Same reads with `source=simulated` | Public demonstration data only |
| `POST /api/v1/sensors/telemetry` | Device bearer token; pit must be authorized |
| `POST /api/v1/simulation/telemetry` | Demonstration data only; existing demo pits |
| `POST /api/v1/sensors/anomaly-trigger` | Simulation only |
| `POST /api/v1/analyze/manual-sample` | Validated input, explicitly unvalidated inference |
| `POST /api/v1/ration/optimize` | Shared experimental formula; `silageQuality` required |
| `POST /api/v1/vision/analyze-image` | 501: not implemented |

A minimal measured packet is `{ "deviceId": "ESP32-SILO-01", "pitId": "pit-a", "temperature_core": 25.4 }`.
Optional fields: `temperature_top`, `temperature_bottom`, `humidity_pct`, `ph_level`,
`moisture_pct`, `ammonia_ppm`, `battery_pct`, `wifi_rssi`, `co2_ppm`, six numeric `nir_bands`.
Unknown fields and non-finite, null, string or out-of-range readings are rejected.
The server assigns receipt timestamps and source metadata. It does not merge old channels
into a new packet. Complete experimental inference requires temperature, pH, feed moisture,
ammonia and optical bands; missing any yields `inference: null`.

Connect WebSocket at `/ws`, then send within five seconds:
`{"type":"SUBSCRIBE","source":"measured","token":"YOUR_DASHBOARD_TOKEN"}`.
No readings are sent before authentication. Simulation subscriptions omit the token.
Use HTTPS/WSS in production; tokens never appear in WebSocket URLs.

## Build, verification and deployment

```sh
npm run check
npm run build
npm start
```

The backend serves `client/dist` at http://localhost:5001. See [Render setup](DEPLOYMENT.md).
A Dockerfile is also supplied; mount `/app/server/data` as persistent writable storage
and configure both credentials. `NODE_ENV=production` refuses startup without them.

The SQLite store is designed for one server instance on one persistent disk. It is not
an HA database. Back up via SQLite's online backup API or stop the server before copying
the database and associated WAL files. Monitor disk space and retained history: at one
packet every five seconds, 10,000 readings is approximately 14 hours per pit. Archive
externally if longer retention is required. Deleting a Render disk deletes its measurements.

## Before any production-AI claim

1. Collect consented, representative sample images and paired traceable laboratory results.
2. Document sensor calibration, reference methods, sample provenance and measurement uncertainty.
3. Validate nutrient models on held-out farms, seasons and crops; publish error and failure rates.
4. Evaluate vision models against annotated reference data and physical particle-size measurements.
5. Have qualified domain experts review assumptions, nutrition constraints and user-facing claims.
6. Add multi-user authorization, backups/restore drills, audit trails and operational monitoring.

Those steps are future scientific and operational work; this implementation does not claim they are complete.
