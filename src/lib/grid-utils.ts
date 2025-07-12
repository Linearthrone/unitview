
export const NUM_COLS_GRID = 17;
export const NUM_ROWS_GRID = 10;

export const getPerimeterCells = (): { row: number; col: number }[] => {
  const cells: { row: number; col: number }[] = [];
  const added = new Set<string>();

  const addCell = (r: number, c: number) => {
    const key = `${r}-${c}`;
    if (r > 0 && r <= NUM_ROWS_GRID && c > 0 && c <= NUM_COLS_GRID && !added.has(key)) {
      cells.push({ row: r, col: c });
      added.add(key);
    }
  };

  const halfWidth = Math.ceil(NUM_COLS_GRID / 2);
  const halfHeight = Math.ceil(NUM_ROWS_GRID / 2);

  // Iteratively add cells from the outside-in for a balanced layout
  
  // 1. Fill top and bottom rows, moving from the edges to the center
  for (let i = 0; i < halfWidth; i++) {
    addCell(1, 1 + i); // Top-left towards center
    addCell(1, NUM_COLS_GRID - i); // Top-right towards center
  }
  for (let i = 0; i < halfWidth; i++) {
     addCell(NUM_ROWS_GRID, 1 + i); // Bottom-left towards center
     addCell(NUM_ROWS_GRID, NUM_COLS_GRID - i); // Bottom-right towards center
  }

  // 2. Fill left and right columns, moving from top to bottom
  // Start from row 2 and end at row NUM_ROWS_GRID - 1 to avoid corners
  for (let i = 1; i < halfHeight; i++) {
     addCell(1 + i, 1); // Top-left-side down
     addCell(NUM_ROWS_GRID - i, 1); // Bottom-left-side up
  }

  for (let i = 1; i < halfHeight; i++) {
    addCell(1 + i, NUM_COLS_GRID); // Top-right-side down
    addCell(NUM_ROWS_GRID - i, NUM_COLS_GRID); // Bottom-right-side up
  }

  return cells;
};
