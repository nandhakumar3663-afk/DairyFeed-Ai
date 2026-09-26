/**
 * Silage Visual Inspection & Particle Size Distribution Classifier
 * Simulates Penn State Particle Separator (PSPS) image analysis and mold classification.
 */

function analyzeSilageImage(imageMetadata = {}) {
  const {
    sampleType = 'corn_silage',
    colorDominance = 'olive_green',
    observedMoistureHint = 'normal'
  } = imageMetadata;

  // Realistic sample classification archetypes
  const archetypes = {
    'optimal_maize': {
      label: 'Golden Olive-Green Maize Silage (Well Preserved)',
      dominantColor: '#65a30d',
      colorStatus: 'Optimal Lactic Preservation',
      moldDetected: false,
      moldCoveragePct: 0.2,
      moldType: 'None detected',
      pspsDistribution: {
        upperSievePct: 6.5,   // > 19 mm (Target: 3-8%)
        middleSievePct: 58.2, // 8 - 19 mm (Target: 45-65%)
        lowerSievePct: 32.1,  // 1.18 - 8 mm (Target: 30-40%)
        bottomPanPct: 3.2     // < 1.18 mm (Target: < 5%)
      },
      pspsStatus: 'Balanced Particle Length',
      rumenAcidosisRisk: 'Low (Safe for High Yield)',
      textureQuality: 'Cracked corn kernels, well-compacted leaf-stem fraction',
      recommendation: 'Excellent physical effective NDF (peNDF). Stimulates ideal rumination chewing time without sorting.'
    },
    'aerobic_moldy': {
      label: 'Surface Aerobic Mold Infestation (Aspergillus / Penicillium)',
      dominantColor: '#94a3b8',
      colorStatus: 'Aerobic Deterioration with White/Gray Fungal Hyphae',
      moldDetected: true,
      moldCoveragePct: 24.5,
      moldType: 'Aspergillus / Penicillium mycotoxin risk',
      pspsDistribution: {
        upperSievePct: 14.2,
        middleSievePct: 48.0,
        lowerSievePct: 30.5,
        bottomPanPct: 7.3
      },
      pspsStatus: 'Coarse & Degraded Clumps',
      rumenAcidosisRisk: 'Moderate / High Mycotoxic Risk',
      textureQuality: 'Slimy and powdery fungal crust with ammoniacal pungent odor',
      recommendation: 'Discard visible moldy crust (> 15 cm deep). Do NOT blend into TMR. Feed binder toxin clays if feeding surrounding layers.'
    },
    'finely_chopped': {
      label: 'Over-Chopped / Pulverized Forage',
      dominantColor: '#84cc16',
      colorStatus: 'Greenish Yellow, Excessive Mastication',
      moldDetected: false,
      moldCoveragePct: 0.8,
      moldType: 'None',
      pspsDistribution: {
        upperSievePct: 1.2,   // Too low (< 3%)
        middleSievePct: 35.4,
        lowerSievePct: 48.6,
        bottomPanPct: 14.8    // High fines (> 5%)
      },
      pspsStatus: 'Excessively Fine Chop Length',
      rumenAcidosisRisk: 'High SARA (Sub-Acute Ruminal Acidosis) Risk',
      textureQuality: 'Pasty, shredded fibers lacking effective scratch factor',
      recommendation: 'Chop length is too short. Mix 1.5 - 2.0 kg of long dry straw (3-5 cm) into daily ration to stimulate cud chewing and prevent milk fat drop.'
    },
    'caramelized_heated': {
      label: 'Dark Brown / Caramelized Tobacco Silage (Maillard Reaction)',
      dominantColor: '#78350f',
      colorStatus: 'Heat Damaged Protein (Maillard Browning)',
      moldDetected: false,
      moldCoveragePct: 3.1,
      moldType: 'None (Thermal denaturation)',
      pspsDistribution: {
        upperSievePct: 8.0,
        middleSievePct: 54.0,
        lowerSievePct: 33.0,
        bottomPanPct: 5.0
      },
      pspsStatus: 'Standard Chop Length',
      rumenAcidosisRisk: 'Low Acidosis, High Indigestible Protein',
      textureQuality: 'Dry, brittle, sweet molasses/burnt tobacco scent',
      recommendation: 'Core temperature exceeded 45°C during packing. Protein is bound to fiber (ADIN). Supplement additional digestible bypass protein.'
    }
  };

  // Pick preset based on hint, or default to optimal
  let result = archetypes[sampleType] || archetypes['optimal_maize'];
  
  return {
    timestamp: new Date().toISOString(),
    ...result
  };
}

module.exports = {
  analyzeSilageImage
};
