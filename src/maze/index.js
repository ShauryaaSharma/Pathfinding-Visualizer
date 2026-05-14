// ─── Maze generators — return array of [row, col, isWeight] ───────────────────

export function randomMaze(grid, rows, cols) {
  const walls = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c].type === 'empty' && Math.random() < 0.28)
        walls.push([r, c, false]);
  return walls;
}

export function randomWeights(grid, rows, cols) {
  const result = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c].type === 'empty' && Math.random() < 0.30)
        result.push([r, c, true]);
  return result;
}

export function recursiveDivisionMaze(grid, rows, cols) {
  const walls = [];
  // Add border
  for (let r = 0; r < rows; r++) { walls.push([r, 0, false]); walls.push([r, cols-1, false]); }
  for (let c = 0; c < cols; c++) { walls.push([0, c, false]); walls.push([rows-1, c, false]); }
  divide(walls, 1, rows-2, 1, cols-2, chooseOrientation(rows-2, cols-2));
  return walls;
}

function divide(walls, rMin, rMax, cMin, cMax, horizontal) {
  if (rMax < rMin || cMax < cMin) return;
  if (horizontal) {
    if (rMax - rMin < 2) return;
    const wallRow = randEven(rMin + 1, rMax - 1);
    const passage = randOdd(cMin, cMax);
    for (let c = cMin; c <= cMax; c++)
      if (c !== passage) walls.push([wallRow, c, false]);
    divide(walls, rMin,      wallRow-1, cMin, cMax, chooseOrientation(wallRow-1 - rMin, cMax-cMin));
    divide(walls, wallRow+1, rMax,      cMin, cMax, chooseOrientation(rMax - wallRow-1, cMax-cMin));
  } else {
    if (cMax - cMin < 2) return;
    const wallCol = randEven(cMin + 1, cMax - 1);
    const passage = randOdd(rMin, rMax);
    for (let r = rMin; r <= rMax; r++)
      if (r !== passage) walls.push([r, wallCol, false]);
    divide(walls, rMin, rMax, cMin,      wallCol-1, chooseOrientation(rMax-rMin, wallCol-1-cMin));
    divide(walls, rMin, rMax, wallCol+1, cMax,      chooseOrientation(rMax-rMin, cMax-wallCol-1));
  }
}

function chooseOrientation(h, w) {
  if (h > w) return true;
  if (w > h) return false;
  return Math.random() < 0.5;
}

function randEven(min, max) {
  let n = Math.floor(Math.random() * (Math.floor((max - min) / 2) + 1)) * 2 + min;
  if (n % 2 !== 0) n++;
  return Math.max(min, Math.min(max, n));
}

function randOdd(min, max) {
  let candidates = [];
  for (let i = min; i <= max; i++) if (i % 2 !== 0) candidates.push(i);
  if (!candidates.length) return min;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
