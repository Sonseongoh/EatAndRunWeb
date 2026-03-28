export function calcAverageKcal(kcalMin: number, kcalMax: number) {
  return Math.round((kcalMin + kcalMax) / 2);
}

export function calcBurnPerKm(weightKg: number) {
  return weightKg * 1.02;
}

export function calcTargetKm(targetKcal: number, weightKg: number) {
  const burnPerKm = calcBurnPerKm(weightKg);
  return Math.max(1, targetKcal / burnPerKm);
}
