export class ValidationError extends Error {
  constructor(message) { super(message); this.status = 400; }
}
export function object(value, label = 'Request') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ValidationError(`${label} must be an object`);
  return value;
}
export function number(value, label, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new ValidationError(`${label} must be a finite number from ${min} to ${max}`);
  }
  return value;
}
export function identifier(value, label) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(value) || ['constructor', 'prototype', '__proto__'].includes(value)) {
    throw new ValidationError(`${label} is not a valid identifier`);
  }
  return value;
}
export function choice(value, label, choices) {
  if (!choices.includes(value)) throw new ValidationError(`${label} must be one of: ${choices.join(', ')}`);
  return value;
}
const ranges = {
  temperature_core: [-40, 100], temperature_top: [-40, 100], temperature_bottom: [-40, 100],
  ph_level: [0, 14], moisture_pct: [0, 99], humidity_pct: [0, 100], ammonia_ppm: [0, 1000],
  battery_pct: [0, 100], wifi_rssi: [-130, 0], co2_ppm: [0, 100000],
};
export function validateTelemetry(input, { sample = false } = {}) {
  object(input);
  const allowed = new Set([...Object.keys(ranges), 'nir_bands', ...(sample ? [] : ['deviceId', 'pitId'])]);
  for (const key of Object.keys(input)) if (!allowed.has(key)) throw new ValidationError(`Unknown telemetry field: ${key}`);
  const result = sample ? {} : { deviceId: identifier(input.deviceId, 'deviceId'), pitId: identifier(input.pitId, 'pitId') };
  number(input.temperature_core, 'temperature_core', ...ranges.temperature_core);
  for (const [key, range] of Object.entries(ranges)) if (key in input) result[key] = number(input[key], key, ...range);
  if ('nir_bands' in input) {
    if (!Array.isArray(input.nir_bands) || input.nir_bands.length !== 6) throw new ValidationError('nir_bands must contain six numeric intensities');
    result.nir_bands = input.nir_bands.map((v, i) => number(v, `nir_bands[${i}]`, 0, 65535));
  }
  if (sample) {
    for (const key of ['ph_level', 'moisture_pct', 'ammonia_ppm', 'nir_bands']) {
      if (!(key in result)) throw new ValidationError(`${key} is required for experimental inference`);
    }
  }
  return result;
}
