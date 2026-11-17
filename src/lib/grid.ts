// Maps viewport width to the maximum usable grid columns, keeping every
// card comfortably readable. Mobile never receives desktop-sized grids.
export function maxColumnsFor(viewportWidth: number): number {
  if (viewportWidth < 480) return 2;
  if (viewportWidth < 680) return 3;
  if (viewportWidth < 900) return 4;
  if (viewportWidth < 1180) return 5;
  return 6;
}

export function effectiveColumns(preferred: number, viewportWidth: number): number {
  return Math.min(Math.max(2, Math.round(preferred)), maxColumnsFor(viewportWidth));
}
