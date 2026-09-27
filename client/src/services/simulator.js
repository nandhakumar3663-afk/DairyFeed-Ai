/**
 * Client-Side Silage Kinetics Engine & Fallback Simulator
 */

export function calculateFliegsScore(ph, dryMatterPct) {
  let baseScore = 100;
  const phDiff = Math.abs(ph - 4.0);
  baseScore -= Math.pow(phDiff * 16, 1.4);
  const dmDiff = Math.abs(dryMatterPct - 33);
  baseScore -= dmDiff * 1.8;
  const score = Math.max(5, Math.min(100, Math.round(baseScore)));

  let grade = 'Very Poor';
  let color = '#ef4444';
  let advisory = 'Severe spoilage risk. High butyric acid and clostridial growth likely.';

  if (score >= 81) {
    grade = 'Very Good (Excellent)';
    color = '#10b981';
    advisory = 'Superb lactic fermentation! Sweet-sour aromatic smell. Highly palatable with maximum milk production efficiency.';
  } else if (score >= 61) {
    grade = 'Good';
    color = '#34d399';
    advisory = 'Well fermented with stable pH. Suitable for high-yielding dairy cattle with standard ration.';
  } else if (score >= 41) {
    grade = 'Moderate / Fair';
    color = '#f59e0b';
    advisory = 'Sub-optimal fermentation. Slight aerobic exposure or secondary fermentation. Feed in limited quantities mixed with dry fodder.';
  } else if (score >= 21) {
    grade = 'Poor';
    color = '#f97316';
    advisory = 'High risk of unpalatability and drop in dry matter intake. Monitor cows for ketosis symptoms.';
  } else {
    grade = 'Hazardous / Spoiled';
    color = '#dc2626';
    advisory = 'DO NOT FEED. Dangerous butyric fermentation and probable mycotoxins. Discard affected pit layers.';
  }

  return { score, grade, color, advisory };
}

export function inferNutritionalProfile(sensorData) {
  const {
    moisture_pct = 66,
    ph_level = 4.1,
    temperature_core = 28.5,
    ammonia_ppm = 18,
    nir_bands = [420, 510, 630, 710, 800, 890]
  } = sensorData;

  const dryMatter = Number((100 - moisture_pct).toFixed(1));
  const b0 = nir_bands[0] || 450;
  const b5 = nir_bands[5] || 650;
  const spectralRatio = (b5 - b0) / (b5 + b0 + 1);

  let crudeProtein = 8.4 + (spectralRatio * 3.2) - ((ph_level - 4.0) * 0.4);
  crudeProtein = Math.max(5.5, Math.min(14.5, Number(crudeProtein.toFixed(2))));

  let ndf = 44.5 + ((35 - dryMatter) * 0.3) + ((ph_level - 4.0) * 1.2);
  ndf = Math.max(38.0, Math.min(62.0, Number(ndf.toFixed(1))));

  let adf = 25.2 + ((ndf - 44) * 0.55);
  adf = Math.max(20.0, Math.min(38.0, Number(adf.toFixed(1))));

  const tdn = Math.max(55.0, Math.min(74.0, Number((88.9 - (0.779 * adf)).toFixed(1))));
  const nel = Number(((tdn * 0.0245) - 0.12).toFixed(2));
  const starch = Math.max(18.0, Math.min(38.0, Number((68.0 - ndf * 0.75).toFixed(1))));

  let moldRisk = 5;
  if (temperature_core > 32) moldRisk += (temperature_core - 32) * 5.5;
  if (ph_level > 4.4) moldRisk += (ph_level - 4.4) * 35;
  if (moisture_pct > 70) moldRisk += (moisture_pct - 70) * 2.5;
  moldRisk = Math.min(99, Math.max(2, Math.round(moldRisk)));

  const flieg = calculateFliegsScore(ph_level, dryMatter);

  return {
    dryMatter,
    crudeProtein,
    ndf,
    adf,
    tdn,
    nel,
    starch,
    moldRisk,
    flieg
  };
}
