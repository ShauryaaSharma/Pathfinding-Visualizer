// ─── Min-Heap (Priority Queue) ────────────────────────────────────────────────
// Replaces the original O(n) linear scan. O(log n) push/pop.
class MinHeap {
  constructor(comparator = (a, b) => a.priority - b.priority) {
    this.heap = [];
    this.cmp  = comparator;
  }
  push(item) {
    this.heap.push(item);
    this.#bubbleUp(this.heap.length - 1);
  }
  pop() {
    if (!this.heap.length) return null;
    const top  = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length) { this.heap[0] = last; this.#sinkDown(0); }
    return top;
  }
  peek()    { return this.heap[0] ?? null; }
  get size(){ return this.heap.length; }
  isEmpty() { return this.heap.length === 0; }

  #bubbleUp(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.cmp(this.heap[p], this.heap[i]) <= 0) break;
      [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]];
      i = p;
    }
  }
  #sinkDown(i) {
    const n = this.heap.length;
    for (;;) {
      let s = i, l = 2*i+1, r = 2*i+2;
      if (l < n && this.cmp(this.heap[l], this.heap[s]) < 0) s = l;
      if (r < n && this.cmp(this.heap[r], this.heap[s]) < 0) s = r;
      if (s === i) break;
      [this.heap[s], this.heap[i]] = [this.heap[i], this.heap[s]];
      i = s;
    }
  }
}

// ─── Grid helpers ─────────────────────────────────────────────────────────────
// grid is a flat Uint16Array / Int16Array: grid[r*cols+c] = weight (0=open, -1=wall, 15=heavy)
function getNeighbors(idx, rows, cols, grid) {
  const nb = [];
  const r = (idx / cols) | 0, c = idx % cols;
  if (r > 0       && grid[(r-1)*cols+c] !== -1) nb.push((r-1)*cols+c);
  if (r < rows-1  && grid[(r+1)*cols+c] !== -1) nb.push((r+1)*cols+c);
  if (c > 0       && grid[r*cols+(c-1)] !== -1) nb.push(r*cols+(c-1));
  if (c < cols-1  && grid[r*cols+(c+1)] !== -1) nb.push(r*cols+(c+1));
  return nb;
}

function manhattan(a, b, cols) {
  return Math.abs((a/cols|0) - (b/cols|0)) + Math.abs(a%cols - b%cols);
}

function reconstructPath(prev, start, end, cols) {
  const path = [];
  let cur = prev[end];
  while (cur !== undefined && cur !== start) {
    path.unshift({ row: (cur/cols)|0, col: cur%cols });
    cur = prev[cur];
  }
  return path;
}

// ─── DIJKSTRA ─────────────────────────────────────────────────────────────────
// Weighted, guarantees shortest path. O((V+E) log V) with MinHeap.
export function dijkstra(grid, rows, cols, sr, sc, er, ec) {
  const start = sr*cols+sc, end = er*cols+ec;
  const dist  = new Float64Array(rows*cols).fill(Infinity);
  const prev  = new Int32Array(rows*cols).fill(-1);
  const vis   = new Uint8Array(rows*cols);
  const order = [];

  dist[start] = 0;
  const pq = new MinHeap((a,b) => a.d - b.d);
  pq.push({ idx: start, d: 0 });

  while (!pq.isEmpty()) {
    const { idx, d } = pq.pop();
    if (vis[idx]) continue;
    vis[idx] = 1;
    order.push({ row: (idx/cols)|0, col: idx%cols });
    if (idx === end) return { visitedOrder: order, path: reconstructPath(prev, start, end, cols), success: true };

    for (const nb of getNeighbors(idx, rows, cols, grid)) {
      const w  = grid[nb] > 0 ? grid[nb] : 1;
      const nd = d + w;
      if (nd < dist[nb]) { dist[nb] = nd; prev[nb] = idx; pq.push({ idx: nb, d: nd }); }
    }
  }
  return { visitedOrder: order, path: [], success: false };
}

// ─── A* SEARCH ────────────────────────────────────────────────────────────────
// Weighted, guarantees shortest path. Uses Manhattan heuristic.
export function astar(grid, rows, cols, sr, sc, er, ec) {
  const start = sr*cols+sc, end = er*cols+ec;
  const g   = new Float64Array(rows*cols).fill(Infinity);
  const f   = new Float64Array(rows*cols).fill(Infinity);
  const prev = new Int32Array(rows*cols).fill(-1);
  const vis  = new Uint8Array(rows*cols);
  const order = [];

  g[start] = 0; f[start] = manhattan(start, end, cols);
  const pq = new MinHeap((a,b) => a.f - b.f);
  pq.push({ idx: start, f: f[start] });

  while (!pq.isEmpty()) {
    const { idx } = pq.pop();
    if (vis[idx]) continue;
    vis[idx] = 1;
    order.push({ row: (idx/cols)|0, col: idx%cols });
    if (idx === end) return { visitedOrder: order, path: reconstructPath(prev, start, end, cols), success: true };

    for (const nb of getNeighbors(idx, rows, cols, grid)) {
      const w  = grid[nb] > 0 ? grid[nb] : 1;
      const ng = g[idx] + w;
      if (ng < g[nb]) {
        g[nb]    = ng;
        f[nb]    = ng + manhattan(nb, end, cols);
        prev[nb] = idx;
        pq.push({ idx: nb, f: f[nb] });
      }
    }
  }
  return { visitedOrder: order, path: [], success: false };
}

// ─── GREEDY BEST-FIRST SEARCH ─────────────────────────────────────────────────
// Weighted, does NOT guarantee shortest path. Purely heuristic-driven.
export function greedy(grid, rows, cols, sr, sc, er, ec) {
  const start = sr*cols+sc, end = er*cols+ec;
  const vis   = new Uint8Array(rows*cols);
  const prev  = new Int32Array(rows*cols).fill(-1);
  const order = [];

  const pq = new MinHeap((a,b) => a.h - b.h);
  pq.push({ idx: start, h: manhattan(start, end, cols) });
  vis[start] = 1;

  while (!pq.isEmpty()) {
    const { idx } = pq.pop();
    order.push({ row: (idx/cols)|0, col: idx%cols });
    if (idx === end) return { visitedOrder: order, path: reconstructPath(prev, start, end, cols), success: true };

    for (const nb of getNeighbors(idx, rows, cols, grid)) {
      if (!vis[nb]) {
        vis[nb] = 1; prev[nb] = idx;
        pq.push({ idx: nb, h: manhattan(nb, end, cols) });
      }
    }
  }
  return { visitedOrder: order, path: [], success: false };
}

// ─── SWARM ALGORITHM ──────────────────────────────────────────────────────────
// Mix of Dijkstra + A*. convergent=false → Swarm, convergent=true → Convergent Swarm.
// Does NOT guarantee shortest path.
export function swarm(grid, rows, cols, sr, sc, er, ec, convergent = false) {
  const start = sr*cols+sc, end = er*cols+ec;
  const dist  = new Float64Array(rows*cols).fill(Infinity);
  const prev  = new Int32Array(rows*cols).fill(-1);
  const vis   = new Uint8Array(rows*cols);
  const order = [];

  dist[start] = 0;
  const pq = new MinHeap((a,b) => a.d - b.d);
  pq.push({ idx: start, d: 0 });

  while (!pq.isEmpty()) {
    const { idx } = pq.pop();
    if (vis[idx]) continue;
    vis[idx] = 1;
    order.push({ row: (idx/cols)|0, col: idx%cols });
    if (idx === end) return { visitedOrder: order, path: reconstructPath(prev, start, end, cols), success: true };

    for (const nb of getNeighbors(idx, rows, cols, grid)) {
      const w  = grid[nb] > 0 ? grid[nb] : 1;
      const h  = manhattan(nb, end, cols);
      const nd = convergent
        ? dist[idx] + (w+1) * Math.pow(h, 7)  // Convergent: heavily heuristic-weighted
        : dist[idx] + (w+1) * h;               // Swarm: linear heuristic blend
      if (nd < dist[nb]) {
        dist[nb] = nd; prev[nb] = idx;
        pq.push({ idx: nb, d: nd });
      }
    }
  }
  return { visitedOrder: order, path: [], success: false };
}

// ─── BIDIRECTIONAL SWARM ──────────────────────────────────────────────────────
// Two simultaneous Swarm searches meeting in the middle.
export function bidirectionalSwarm(grid, rows, cols, sr, sc, er, ec) {
  const start = sr*cols+sc, end = er*cols+ec;
  const n     = rows*cols;
  const distF = new Float64Array(n).fill(Infinity);
  const distB = new Float64Array(n).fill(Infinity);
  const prevF = new Int32Array(n).fill(-1);
  const prevB = new Int32Array(n).fill(-1);
  const visF  = new Uint8Array(n);
  const visB  = new Uint8Array(n);
  const order = [];

  distF[start] = 0; distB[end] = 0;
  const pqF = new MinHeap((a,b) => a.d - b.d);
  const pqB = new MinHeap((a,b) => a.d - b.d);
  pqF.push({ idx: start, d: 0 });
  pqB.push({ idx: end,   d: 0 });

  const step = (pq, dist, vis, otherVis, prev, target) => {
    if (pq.isEmpty()) return -1;
    const { idx, d } = pq.pop();
    if (vis[idx]) return -1;
    vis[idx] = 1;
    order.push({ row: (idx/cols)|0, col: idx%cols });
    if (otherVis[idx]) return idx; // meeting point found

    for (const nb of getNeighbors(idx, rows, cols, grid)) {
      const w  = grid[nb] > 0 ? grid[nb] : 1;
      const h  = manhattan(nb, target, cols);
      const nd = d + (w+1)*h;
      if (nd < dist[nb]) { dist[nb] = nd; prev[nb] = idx; pq.push({ idx: nb, d: nd }); }
    }
    return -1;
  };

  while (!pqF.isEmpty() || !pqB.isEmpty()) {
    let meet = step(pqF, distF, visF, visB, prevF, end);
    if (meet >= 0) {
      // Reconstruct both halves
      const pathF = [], pathB = [];
      let cur = prevF[meet];
      while (cur !== -1 && cur !== start) { pathF.unshift({ row:(cur/cols)|0, col:cur%cols }); cur = prevF[cur]; }
      cur = prevB[meet];
      while (cur !== -1 && cur !== end)   { pathB.push({ row:(cur/cols)|0, col:cur%cols }); cur = prevB[cur]; }
      return { visitedOrder: order, path: [...pathF, { row:(meet/cols)|0, col:meet%cols }, ...pathB], success: true };
    }
    meet = step(pqB, distB, visB, visF, prevB, start);
    if (meet >= 0) {
      const pathF = [], pathB = [];
      let cur = prevF[meet];
      while (cur !== -1 && cur !== start) { pathF.unshift({ row:(cur/cols)|0, col:cur%cols }); cur = prevF[cur]; }
      cur = prevB[meet];
      while (cur !== -1 && cur !== end)   { pathB.push({ row:(cur/cols)|0, col:cur%cols }); cur = prevB[cur]; }
      return { visitedOrder: order, path: [...pathF, { row:(meet/cols)|0, col:meet%cols }, ...pathB], success: true };
    }
  }
  return { visitedOrder: order, path: [], success: false };
}

// ─── BFS ──────────────────────────────────────────────────────────────────────
// Unweighted, guarantees shortest path. Standard queue.
export function bfs(grid, rows, cols, sr, sc, er, ec) {
  const start = sr*cols+sc, end = er*cols+ec;
  const vis   = new Uint8Array(rows*cols);
  const prev  = new Int32Array(rows*cols).fill(-1);
  const order = [];
  const queue = [start];
  vis[start]  = 1;

  while (queue.length) {
    const idx = queue.shift();
    order.push({ row: (idx/cols)|0, col: idx%cols });
    if (idx === end) return { visitedOrder: order, path: reconstructPath(prev, start, end, cols), success: true };
    for (const nb of getNeighbors(idx, rows, cols, grid)) {
      if (!vis[nb]) { vis[nb] = 1; prev[nb] = idx; queue.push(nb); }
    }
  }
  return { visitedOrder: order, path: [], success: false };
}

// ─── DFS ──────────────────────────────────────────────────────────────────────
// Unweighted, does NOT guarantee shortest path. Standard stack.
export function dfs(grid, rows, cols, sr, sc, er, ec) {
  const start = sr*cols+sc, end = er*cols+ec;
  const vis   = new Uint8Array(rows*cols);
  const prev  = new Int32Array(rows*cols).fill(-1);
  const order = [];
  const stack = [start];

  while (stack.length) {
    const idx = stack.pop();
    if (vis[idx]) continue;
    vis[idx] = 1;
    order.push({ row: (idx/cols)|0, col: idx%cols });
    if (idx === end) return { visitedOrder: order, path: reconstructPath(prev, start, end, cols), success: true };
    for (const nb of getNeighbors(idx, rows, cols, grid)) {
      if (!vis[nb]) { prev[nb] = idx; stack.push(nb); }
    }
  }
  return { visitedOrder: order, path: [], success: false };
}

// ─── DISPATCHER ───────────────────────────────────────────────────────────────
// Converts 2D node grid → flat Int16Array, then calls the right algorithm.
// grid2d[row][col] = { type: string, weight: number }
export function runAlgorithm(name, heuristic, grid2d, rows, cols, sr, sc, er, ec) {
  // Build flat representation: 0=open, -1=wall, 15=weight
  const flat = new Int16Array(rows*cols);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const n = grid2d[r][c];
      flat[r*cols+c] = n.type === 'wall' ? -1 : (n.weight || 0);
    }

  switch (name) {
    case 'dijkstra':    return dijkstra(flat, rows, cols, sr, sc, er, ec);
    case 'astar':       return astar(flat, rows, cols, sr, sc, er, ec);
    case 'greedy':      return greedy(flat, rows, cols, sr, sc, er, ec);
    case 'swarm':       return swarm(flat, rows, cols, sr, sc, er, ec, false);
    case 'convergent':  return swarm(flat, rows, cols, sr, sc, er, ec, true);
    case 'bidirectional': return bidirectionalSwarm(flat, rows, cols, sr, sc, er, ec);
    case 'bfs':         return bfs(flat, rows, cols, sr, sc, er, ec);
    case 'dfs':         return dfs(flat, rows, cols, sr, sc, er, ec);
    default:            return { visitedOrder: [], path: [], success: false };
  }
}
