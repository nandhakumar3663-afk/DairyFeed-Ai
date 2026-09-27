# Render deployment

Use the root `render.yaml` Blueprint to create one Node web service with a **1 GB persistent disk**.
The React app, REST API and WebSocket are served from the same HTTPS hostname. No separate
frontend service is needed. The old static-only Pages workflow now runs validation instead.

## Configuration

- Runtime: Node 22.22.1
- Build: `npm ci --prefix client --include=dev && npm ci --prefix server && npm run check`
- Start: `node server/server.js`
- Health: `/api/v1/health`
- Database: `/var/data/telemetry.sqlite` on the mounted `/var/data` disk
- Instances: one (SQLite is local to this disk)
- Dashboard and device tokens: independently generated secret environment values
- Initial device: `ESP32-SILO-01`; permitted location: `pit-a`
- Allowed browser origin defaults to Render's `RENDER_EXTERNAL_URL`. For custom domains,
  set `PUBLIC_ORIGIN` to a comma-separated exact origin list, with no trailing slashes.
- Automatic deploys are off. Validate and manually deploy a reviewed commit.

## Publish

1. Push the reviewed code to GitHub. In Render, create a Blueprint from that repository
   and select the branch containing these changes.
2. Review the service plan and disk charges before creating resources. Render requires a
   paid web service for persistent disks; a free service does not meet the storage requirement.
3. Apply the Blueprint. Wait for checks, build and health verification to finish.
4. Retrieve the generated dashboard token from Render's secret environment configuration
   and enter it in the dashboard. Keep it private. Configure the generated device token only
   on the matching device. Never share a dashboard URL with a token attached.
5. Test an authenticated packet from the device; check that simulated data stays separate,
   then restart the service and verify the measurement persists.

For an existing service, apply the same settings manually. Existing measurements should
be backed up before changing disk paths. A persistent disk prevents multiple instances
and changes deployment availability; a single instance can have a short restart outage.

A committed Blueprint is a deployment configuration, **not proof of a live deployment**.
A successful Render deployment and its URL must be verified separately.
