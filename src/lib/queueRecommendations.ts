export interface QueueRecommendationInput {
  waitMinutes: number;
  distanceKm: number;
  rating: number;
  visitCount: number;
}

export interface QueueRecommendationResult {
  score: number;
  waitComponent: number;
  distanceComponent: number;
  ratingComponent: number;
  historyComponent: number;
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function scoreQueueRecommendation(input: QueueRecommendationInput): QueueRecommendationResult {
  const waitNorm = clamp01(1 - input.waitMinutes / 90);
  const distanceNorm = clamp01(1 - input.distanceKm / 15);
  const ratingNorm = clamp01(input.rating / 5);
  const historyNorm = clamp01(Math.min(input.visitCount, 10) / 10);

  const waitComponent = waitNorm * 0.4;
  const distanceComponent = distanceNorm * 0.2;
  const ratingComponent = ratingNorm * 0.25;
  const historyComponent = historyNorm * 0.15;

  return {
    score: Number(((waitComponent + distanceComponent + ratingComponent + historyComponent) * 100).toFixed(1)),
    waitComponent,
    distanceComponent,
    ratingComponent,
    historyComponent,
  };
}
