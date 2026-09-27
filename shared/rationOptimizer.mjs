import { object, number, choice, ValidationError } from './validation.mjs';

// Experimental assumptions, not an ICAR-certified formulation or least-cost solver.
export const ANIMAL_PROFILES = {
  indigenous_gir: { name: 'Indigenous cow', dm: 2.4, cp: 320, tdn: 2.6, milkCP: 82, milkTDN: 0.36 },
  crossbred_hf: { name: 'Crossbred cow', dm: 3.1, cp: 380, tdn: 3.1, milkCP: 88, milkTDN: 0.38 },
  murrah_buffalo: { name: 'Murrah buffalo', dm: 2.9, cp: 440, tdn: 3.5, milkCP: 105, milkTDN: 0.45 },
};
const round = (n, digits = 2) => Number(n.toFixed(digits));
export function optimizeRation(input) {
  object(input);
  const animalType = choice(input.animalType ?? 'crossbred_hf', 'animalType', Object.keys(ANIMAL_PROFILES));
  const bodyWeight = number(input.bodyWeight ?? 480, 'bodyWeight', 150, 1000);
  const milkYield = number(input.milkYield ?? 14, 'milkYield', 0, 60);
  const fatPercentage = number(input.fatPercentage ?? 4, 'fatPercentage', 2, 10);
  const stage = choice(input.lactationStage ?? 'mid', 'lactationStage', ['early', 'mid', 'late', 'dry']);
  if (stage === 'dry' && milkYield !== 0) throw new ValidationError('A dry animal must have zero milk yield');
  const q = object(input.silageQuality, 'silageQuality');
  number(q.dryMatter, 'dryMatter', 1, 99);
  number(q.crudeProtein, 'crudeProtein', 0, 40);
  number(q.tdn, 'tdn', 0, 100);
  number(q.fliegScore, 'fliegScore', 0, 100);
  number(q.moldRisk ?? 0, 'moldRisk', 0, 100);
  const baseline = input.baselineDailyCostINR == null ? null : number(input.baselineDailyCostINR, 'baselineDailyCostINR', 0, 10000);
  const prices = { silage: 3.5, green: 2, straw: 5, concentrate: 28, mineralsDaily: 12, ...object(input.prices ?? {}, 'prices') };
  for (const [key, value] of Object.entries(prices)) number(value, `prices.${key}`, 0, 1000);
  const profile = ANIMAL_PROFILES[animalType];
  const capacity = bodyWeight * profile.dm / 100 * (stage === 'early' ? .95 : stage === 'late' ? 1.05 : stage === 'dry' ? .85 : 1);
  const cpTarget = profile.cp + milkYield * profile.milkCP * fatPercentage / 4;
  const tdnTarget = profile.tdn + milkYield * profile.milkTDN * fatPercentage / 4;
  const meta = { validated: false, method: 'experimental-ration-v1', animalName: profile.name, bodyWeight, milkYield,
    dmiCapacity: round(capacity), requirements: { totalCP_grams: round(cpTarget), totalTDN_kg: round(tdnTarget) },
    warning: 'Illustrative calculation only. Feed composition and animal requirements need professional validation.' };
  if (q.fliegScore < 40 || (q.moldRisk ?? 0) >= 50) {
    return { ...meta, status: 'blocked', rationPlan: null, economics: null, warnings: ['Quality indicators are concerning. No ration generated; obtain laboratory and nutritionist review.'] };
  }
  const silageDM = Math.min(capacity * .45 * (q.fliegScore < 60 ? .8 : 1), 6.5);
  const strawDM = Math.min(capacity * .20, 2.5);
  const greenDM = Math.min(capacity * .15, 2);
  const suppliedCP = silageDM * q.crudeProtein * 10 + strawDM * 35 + greenDM * 100;
  const suppliedTDN = silageDM * q.tdn / 100 + strawDM * .42 + greenDM * .58;
  const requiredConcentrate = Math.max(0, (cpTarget - suppliedCP) / 180, (tdnTarget - suppliedTDN) / .648);
  const maxConcentrate = Math.max(0, (capacity - silageDM - strawDM - greenDM) / .9);
  const concentrate = Math.min(requiredConcentrate, maxConcentrate);
  const plan = { analyzedSilageKg: round(silageDM / (q.dryMatter / 100)), greenFodderKg: round(greenDM / .2),
    dryStrawKg: round(strawDM / .9), compoundConcentrateKg: round(concentrate),
    mineralMixtureGrams: milkYield > 12 ? 100 : 75, cleanWaterLiters: Math.round(bodyWeight * .1 + milkYield * 3.5) };
  // Reconcile nutrients using the actual rounded quantities shown to the user.
  const actualSilageDM = plan.analyzedSilageKg * q.dryMatter / 100;
  const actualStrawDM = plan.dryStrawKg * .9;
  const actualGreenDM = plan.greenFodderKg * .2;
  const actualConcentrateDM = plan.compoundConcentrateKg * .9;
  const actualCP = actualSilageDM * q.crudeProtein * 10 + actualStrawDM * 35 + actualGreenDM * 100 + plan.compoundConcentrateKg * 180;
  const actualTDN = actualSilageDM * q.tdn / 100 + actualStrawDM * .42 + actualGreenDM * .58 + actualConcentrateDM * .72;
  const warnings = [];
  if (actualCP < cpTarget - 5 || actualTDN < tdnTarget - .02) warnings.push('Nutrient targets cannot be met within the estimated intake capacity. This is not a balanced feeding recommendation.');
  const dailyCost = round(plan.analyzedSilageKg * prices.silage + plan.greenFodderKg * prices.green + plan.dryStrawKg * prices.straw + plan.compoundConcentrateKg * prices.concentrate + prices.mineralsDaily);
  const savings = baseline === null ? null : round(baseline - dailyCost);
  return { ...meta, status: warnings.length ? 'infeasible' : 'illustrative', warnings, rationPlan: plan,
    supplied: { dryMatterKg: round(actualSilageDM + actualStrawDM + actualGreenDM + actualConcentrateDM), totalCP_grams: round(actualCP), totalTDN_kg: round(actualTDN) },
    economics: { dailyFeedCostINR: dailyCost, baselineDailyCostINR: baseline, dailySavingsINR: savings,
      monthlySavingsPerCowINR: savings === null ? null : round(savings * 30), annualSavingsTenCowsINR: savings === null ? null : round(savings * 365 * 10), prices } };
}
