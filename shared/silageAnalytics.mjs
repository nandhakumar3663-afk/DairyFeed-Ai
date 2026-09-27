import { validateTelemetry } from './validation.mjs';
/**
 * Silage Quality & Nutritional Inference Engine
 * Based on ICAR (Indian Council of Agricultural Research), NRC Dairy,
 * and German Agricultural Society (DLG) Flieg's Silage Fermentation Index.
 */

// Calculate Flieg's Score for Silage Fermentation
// Flieg's index evaluates silage based on pH and Dry Matter % (or lactic vs butyric acid)
export function calculateFliegsScore(ph, dryMatterPct) {
  // Classic Flieg Formula adaptation for rapid on-farm sensor arrays:
  // Optimal silage pH is 3.8 - 4.2 for corn/sorghum, 4.3 - 4.6 for alfalfa/legume.
  // Optimal Dry Matter is 30% - 38%.
  
  let baseScore = 100;
  
  // Penalize pH deviation from optimal 4.0
  const phDiff = Math.abs(ph - 4.0);
  baseScore -= Math.pow(phDiff * 16, 1.4);
  
  // Penalize DM deviation from optimal 33%
  const dmDiff = Math.abs(dryMatterPct - 33);
  baseScore -= dmDiff * 1.8;
  
  // Clamp between 0 and 100
  const score = Math.max(5, Math.min(100, Math.round(baseScore)));
  
  let grade = 'Very Poor';
  let color = '#ef4444'; // Red
  let lacticAcidEstimate = 4.5; // % of DM
  let aceticAcidEstimate = 1.8;
  let butyricAcidEstimate = 0.05;
  let advisory = 'Severe spoilage risk. High butyric acid and clostridial growth likely.';

  if (score >= 81) {
    grade = 'Very Good (Excellent)';
    color = '#10b981'; // Emerald
    lacticAcidEstimate = (6.5 + (score - 80) * 0.1).toFixed(1);
    aceticAcidEstimate = 1.5;
    butyricAcidEstimate = 0.01;
    advisory = 'Superb lactic fermentation! Sweet-sour aromatic smell. Highly palatable with maximum milk production efficiency.';
  } else if (score >= 61) {
    grade = 'Good';
    color = '#34d399'; // Mint Green
    lacticAcidEstimate = 5.2;
    aceticAcidEstimate = 2.0;
    butyricAcidEstimate = 0.08;
    advisory = 'Well fermented with stable pH. Suitable for high-yielding dairy cattle with standard ration.';
  } else if (score >= 41) {
    grade = 'Moderate / Fair';
    color = '#f59e0b'; // Amber
    lacticAcidEstimate = 3.4;
    aceticAcidEstimate = 2.8;
    butyricAcidEstimate = 0.25;
    advisory = 'Sub-optimal fermentation. Slight aerobic exposure or secondary fermentation. Feed in limited quantities mixed with dry fodder.';
  } else if (score >= 21) {
    grade = 'Poor';
    color = '#f97316'; // Orange
    lacticAcidEstimate = 1.9;
    aceticAcidEstimate = 3.5;
    butyricAcidEstimate = 0.65;
    advisory = 'High risk of unpalatability and drop in dry matter intake. Monitor cows for ketosis symptoms.';
  } else {
    grade = 'Hazardous / Spoiled';
    color = '#dc2626'; // Red
    lacticAcidEstimate = 0.8;
    aceticAcidEstimate = 4.2;
    butyricAcidEstimate = 1.40;
    advisory = 'DO NOT FEED. Dangerous butyric fermentation and probable mycotoxins. Discard affected pit layers.';
  }

  return {
    score,
    grade,
    color,
    lacticAcid: Number(lacticAcidEstimate),
    aceticAcid: Number(aceticAcidEstimate),
    butyricAcid: Number(butyricAcidEstimate),
    advisory: 'Unvalidated experimental score. Laboratory analysis is required; this score does not establish feed safety.'
  };
}

// Proximate Nutritional Matrix derived from NIR spectral reflectance & physical probes
export function inferNutritionalProfile(sensorData) {
  const {
    moisture_pct = 66,
    ph_level = 4.1,
    temperature_core = 28.5,
    ammonia_ppm = 18,
    nir_bands = [420, 510, 630, 710, 800, 890]
  } = validateTelemetry(sensorData, { sample: true });

  // Dry Matter % is 100 - Moisture %
  const dryMatter = Number((100 - moisture_pct).toFixed(1));

  // NIR band proxy coefficients (calibrated for green maize / sorghum silage):
  // AS7262 channels: 450nm (violet), 500nm (blue), 550nm (green), 570nm (yellow), 600nm (orange), 650nm (red)
  const b0 = nir_bands[0] || 450;
  const b2 = nir_bands[2] || 550;
  const b5 = nir_bands[5] || 650;

  // Crude Protein (CP %) estimation (Maize silage typically 7.5% - 9.5%, Sorghum 6.5% - 8.5%, Oat/Barley 10% - 13%)
  // Normalized spectral index ratio
  const spectralRatio = (b5 - b0) / (b5 + b0 + 1);
  let crudeProtein = 8.4 + (spectralRatio * 3.2) - ((ph_level - 4.0) * 0.4);
  crudeProtein = Math.max(5.5, Math.min(14.5, Number(crudeProtein.toFixed(2))));

  // Neutral Detergent Fiber (NDF %) - Cow rumen fill indicator (Target: 40% - 48%)
  let ndf = 44.5 + ((35 - dryMatter) * 0.3) + ((ph_level - 4.0) * 1.2);
  ndf = Math.max(38.0, Math.min(62.0, Number(ndf.toFixed(1))));

  // Acid Detergent Fiber (ADF %) - Indigestible lignocellulose (Target: 22% - 28%)
  let adf = 25.2 + ((ndf - 44) * 0.55);
  adf = Math.max(20.0, Math.min(38.0, Number(adf.toFixed(1))));

  // Total Digestible Nutrients (TDN %) = 88.9 - (0.779 * ADF)
  const tdn = Math.max(55.0, Math.min(74.0, Number((88.9 - (0.779 * adf)).toFixed(1))));

  // Net Energy for Lactation (NEL Mcal/kg DM) = (TDN * 0.0245) - 0.12
  const nel = Number(((tdn * 0.0245) - 0.12).toFixed(2));

  // Starch % (typically 25% - 35% in quality corn silage)
  const starch = Math.max(18.0, Math.min(38.0, Number((68.0 - ndf * 0.75).toFixed(1))));

  // Ammonia Nitrogen as % of Total Nitrogen (NH3-N / Total N)
  // MQ-135 ammonia ppm correlates directly to proteolysis
  const ammoniaN_ratio = Number(Math.min(22, Math.max(3, (ammonia_ppm * 0.35 + (ph_level - 3.8) * 2.2))).toFixed(1));

  // Aflatoxin / Mold Spoilage Risk (0 - 100%)
  // Mold thrives if: Core temp > 35°C (aerobic heating), pH > 4.6, or Moisture > 72%
  let moldRisk = 5;
  if (temperature_core > 32) moldRisk += (temperature_core - 32) * 5.5;
  if (ph_level > 4.4) moldRisk += (ph_level - 4.4) * 35;
  if (moisture_pct > 70) moldRisk += (moisture_pct - 70) * 2.5;
  if (ammonia_ppm > 40) moldRisk += (ammonia_ppm - 40) * 0.8;
  moldRisk = Math.min(99, Math.max(2, Math.round(moldRisk)));

  const flieg = calculateFliegsScore(ph_level, dryMatter);

  return {
    validated: false,
    method: 'experimental-heuristic-v1',
    warning: 'Not laboratory analysis or an aflatoxin measurement. Do not use to certify feed safety.',
    dryMatter,
    crudeProtein,
    ndf,
    adf,
    tdn,
    nel,
    starch,
    ammoniaN_ratio,
    moldRisk,
    flieg
  };
}

