
export const NUM_COLS_GRID = 22;
export const NUM_ROWS_GRID = 12;

export const getPerimeterCells = (): { row: number; col: number }[] => {
  const cells: { row: number; col: number }[] = [];

  // Top row (left to right)
  for (let c = 1; c <= NUM_COLS_GRID; c++) {
    cells.push({ row: 1, col: c });
  }
  // Right column (top to bottom, skipping already added top-right corner)
  for (let r = 2; r <= NUM_ROWS_GRID; r++) {
    cells.push({ row: r, col: NUM_COLS_GRID });
  }
  // Bottom row (right to left, skipping already added bottom-right corner)
  for (let c = NUM_COLS_GRID - 1; c >= 1; c--) {
    cells.push({ row: NUM_ROWS_GRID, col: c });
  }
  // Left column (bottom to top, skipping already added bottom-left and top-left corners)
  for (let r = NUM_ROWS_GRID - 1; r >= 2; r--) {
    cells.push({ row: r, col: 1 });
  }
  return cells;
};
