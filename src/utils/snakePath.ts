export function buildSnakePath(
  numPoints: number,
  containerWidth: number,
  containerHeight: number,
): { x: number; y: number }[] {
  if (numPoints <= 0) return [];

  const COLS = Math.min(4, numPoints);
  const rows = Math.ceil(numPoints / COLS);
  const padH = 16;
  const padV = 20;
  const colSpacing = COLS > 1 ? (containerWidth - padH * 2) / (COLS - 1) : 0;
  const rowSpacing = rows > 1 ? (containerHeight - padV * 2) / (rows - 1) : 0;

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const row = Math.floor(i / COLS);
    const posInRow = i % COLS;
    const col = row % 2 === 0 ? posInRow : COLS - 1 - posInRow;
    pts.push({ x: padH + col * colSpacing, y: padV + row * rowSpacing });
  }
  return pts;
}
