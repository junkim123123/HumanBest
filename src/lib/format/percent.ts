export function safePercent(value?: number | null): number {
  if (value === null || value === undefined) return 0;
  if (!Number.isFinite(value)) return 0;
  if (Number.isNaN(value)) return 0;

  // Treat ratios (0-1) as percentages
  const normalized = value >= 0 && value <= 1 ? value * 100 : value;

  if (normalized <= 0) return 0;
  if (normalized >= 100) return 100;

  return Math.round(normalized);
}