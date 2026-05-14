/**
 * ============================================================
 *  Pathfinding Algorithms — C++ / Emscripten (WebAssembly)
 * ============================================================
 *
 *  All 8 algorithms are implemented here in C++ for maximum
 *  performance. The JS fallback (src/algorithms/index.js) uses
 *  the same logic ported to JavaScript with TypedArrays and a
 *  MinHeap — it runs automatically when WASM is unavailable.
 *
 *  Build with Emscripten (emsdk activated):
 *
 *    emcc algorithms.cpp -O3 -o ../public/pathfinder.js \
 *         -s MODULARIZE=1 \
 *         -s EXPORT_NAME=PathfinderModule \
 *         -s EXPORTED_RUNTIME_METHODS='["cwrap","ccall"]' \
 *         --bind
 *
 *  The output (pathfinder.js + pathfinder.wasm) goes into
 *  /public/ so Vite serves it as a static asset.
 *
 *  Grid encoding (flat Int16Array, row-major):
 *    grid[r*cols + c] =  0  → open cell (cost 1)
 *                      = -1  → wall (impassable)
 *                      > 0   → weighted cell (cost = value, e.g. 15)
 *
 *  All exported functions accept a comma-separated integer string
 *  for the grid data and return a compact JSON string:
 *    { "v": [...visitedIndices], "p": [...pathIndices], "ok": 0|1 }
 *  The JS side decodes: row = idx / cols | 0,  col = idx % cols
 * ============================================================
 */

#include <vector>
#include <queue>
#include <deque>
#include <cmath>
#include <string>
#include <sstream>
#include <algorithm>
#include <limits>
#include <functional>

#ifdef __EMSCRIPTEN__
  #include <emscripten/bind.h>
  using namespace emscripten;
#endif

// ─── Constants ───────────────────────────────────────────────────────────────
static constexpr int   WALL_VAL = -1;
static constexpr float INF      = std::numeric_limits<float>::infinity();

// ─── Min-Heap node ────────────────────────────────────────────────────────────
struct HeapNode {
  int   idx;
  float priority;
  bool operator>(const HeapNode& o) const { return priority > o.priority; }
};
using MinPQ = std::priority_queue<HeapNode,
                                  std::vector<HeapNode>,
                                  std::greater<HeapNode>>;

// ─── Grid helpers ─────────────────────────────────────────────────────────────
static std::vector<int> getNeighbors(int idx, int rows, int cols,
                                      const std::vector<int>& grid) {
  std::vector<int> nb;
  nb.reserve(4);
  const int r = idx / cols, c = idx % cols;
  auto add = [&](int nr, int nc) {
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      const int ni = nr * cols + nc;
      if (grid[ni] != WALL_VAL) nb.push_back(ni);
    }
  };
  add(r - 1, c); add(r + 1, c);
  add(r, c - 1); add(r, c + 1);
  return nb;
}

static float manhattan(int a, int b, int cols) {
  return static_cast<float>(
    std::abs(a / cols - b / cols) + std::abs(a % cols - b % cols));
}

static std::vector<int> reconstructPath(const std::vector<int>& prev,
                                         int start, int end) {
  std::vector<int> path;
  int cur = prev[end];
  while (cur != -1 && cur != start) { path.push_back(cur); cur = prev[cur]; }
  std::reverse(path.begin(), path.end());
  return path;
}

// ─── JSON result builder ──────────────────────────────────────────────────────
static std::string buildResult(const std::vector<int>& visited,
                                const std::vector<int>& path,
                                bool success) {
  std::ostringstream ss;
  ss << "{\"v\":[";
  for (size_t i = 0; i < visited.size(); ++i) { if (i) ss << ','; ss << visited[i]; }
  ss << "],\"p\":[";
  for (size_t i = 0; i < path.size();    ++i) { if (i) ss << ','; ss << path[i];    }
  ss << "],\"ok\":" << (success ? 1 : 0) << "}";
  return ss.str();
}

// ─── Dijkstra ─────────────────────────────────────────────────────────────────
// Guaranteed shortest path. Weighted. O((V+E) log V).
static std::string dijkstra_impl(const std::vector<int>& grid,
                                  int rows, int cols,
                                  int sr, int sc, int er, int ec) {
  const int n = rows * cols, start = sr*cols+sc, end = er*cols+ec;
  std::vector<float> dist(n, INF);
  std::vector<int>   prev(n, -1);
  std::vector<bool>  vis(n, false);
  std::vector<int>   order; order.reserve(n);

  dist[start] = 0;
  MinPQ pq; pq.push({start, 0});

  while (!pq.empty()) {
    auto [idx, d] = pq.top(); pq.pop();
    if (vis[idx]) continue;
    vis[idx] = true; order.push_back(idx);
    if (idx == end) return buildResult(order, reconstructPath(prev, start, end), true);
    for (int nb : getNeighbors(idx, rows, cols, grid)) {
      float w  = grid[nb] > 0 ? (float)grid[nb] : 1.0f;
      float nd = d + w;
      if (nd < dist[nb]) { dist[nb] = nd; prev[nb] = idx; pq.push({nb, nd}); }
    }
  }
  return buildResult(order, {}, false);
}

// ─── A* Search ────────────────────────────────────────────────────────────────
// Guaranteed shortest path. Weighted. Manhattan heuristic.
static std::string astar_impl(const std::vector<int>& grid,
                               int rows, int cols,
                               int sr, int sc, int er, int ec) {
  const int n = rows * cols, start = sr*cols+sc, end = er*cols+ec;
  std::vector<float> g(n, INF), f(n, INF);
  std::vector<int>   prev(n, -1);
  std::vector<bool>  vis(n, false);
  std::vector<int>   order; order.reserve(n);

  g[start] = 0; f[start] = manhattan(start, end, cols);
  MinPQ pq; pq.push({start, f[start]});

  while (!pq.empty()) {
    auto [idx, _f] = pq.top(); pq.pop();
    if (vis[idx]) continue;
    vis[idx] = true; order.push_back(idx);
    if (idx == end) return buildResult(order, reconstructPath(prev, start, end), true);
    for (int nb : getNeighbors(idx, rows, cols, grid)) {
      float w  = grid[nb] > 0 ? (float)grid[nb] : 1.0f;
      float ng = g[idx] + w;
      if (ng < g[nb]) {
        g[nb] = ng; f[nb] = ng + manhattan(nb, end, cols);
        prev[nb] = idx; pq.push({nb, f[nb]});
      }
    }
  }
  return buildResult(order, {}, false);
}

// ─── Greedy Best-First Search ─────────────────────────────────────────────────
// NOT guaranteed shortest. Purely heuristic-driven.
static std::string greedy_impl(const std::vector<int>& grid,
                                int rows, int cols,
                                int sr, int sc, int er, int ec) {
  const int n = rows * cols, start = sr*cols+sc, end = er*cols+ec;
  std::vector<bool> vis(n, false);
  std::vector<int>  prev(n, -1), order; order.reserve(n);

  MinPQ pq; pq.push({start, manhattan(start, end, cols)});
  vis[start] = true;

  while (!pq.empty()) {
    auto [idx, _h] = pq.top(); pq.pop();
    order.push_back(idx);
    if (idx == end) return buildResult(order, reconstructPath(prev, start, end), true);
    for (int nb : getNeighbors(idx, rows, cols, grid)) {
      if (!vis[nb]) { vis[nb] = true; prev[nb] = idx; pq.push({nb, manhattan(nb, end, cols)}); }
    }
  }
  return buildResult(order, {}, false);
}

// ─── Swarm / Convergent Swarm ─────────────────────────────────────────────────
// Blend of distance + heuristic. NOT guaranteed shortest.
//   convergent = false → Swarm:            cost += (w+1)*h
//   convergent = true  → Convergent Swarm: cost += (w+1)*h^7
static std::string swarm_impl(const std::vector<int>& grid,
                               int rows, int cols,
                               int sr, int sc, int er, int ec,
                               bool convergent) {
  const int n = rows * cols, start = sr*cols+sc, end = er*cols+ec;
  std::vector<float> dist(n, INF);
  std::vector<int>   prev(n, -1);
  std::vector<bool>  vis(n, false);
  std::vector<int>   order; order.reserve(n);

  dist[start] = 0;
  MinPQ pq; pq.push({start, 0});

  while (!pq.empty()) {
    auto [idx, d] = pq.top(); pq.pop();
    if (vis[idx]) continue;
    vis[idx] = true; order.push_back(idx);
    if (idx == end) return buildResult(order, reconstructPath(prev, start, end), true);
    for (int nb : getNeighbors(idx, rows, cols, grid)) {
      float w  = grid[nb] > 0 ? (float)grid[nb] : 1.0f;
      float h  = manhattan(nb, end, cols);
      float nd = convergent
        ? dist[idx] + (w + 1.0f) * std::pow(h, 7.0f)
        : dist[idx] + (w + 1.0f) * h;
      if (nd < dist[nb]) { dist[nb] = nd; prev[nb] = idx; pq.push({nb, nd}); }
    }
  }
  return buildResult(order, {}, false);
}

// ─── Bidirectional Swarm ──────────────────────────────────────────────────────
// Two simultaneous Swarm searches from start+end. NOT guaranteed shortest.
static std::string biSwarm_impl(const std::vector<int>& grid,
                                 int rows, int cols,
                                 int sr, int sc, int er, int ec) {
  const int n = rows * cols, start = sr*cols+sc, end = er*cols+ec;
  std::vector<float> dF(n, INF), dB(n, INF);
  std::vector<int>   pF(n, -1),  pB(n, -1);
  std::vector<bool>  vF(n, false), vB(n, false);
  std::vector<int>   order; order.reserve(n);

  dF[start] = 0; dB[end] = 0;
  MinPQ pqF, pqB;
  pqF.push({start, 0}); pqB.push({end, 0});

  auto buildBiPath = [&](int meet) {
    std::vector<int> pathF, pathB;
    for (int cur = pF[meet]; cur != -1 && cur != start; cur = pF[cur]) pathF.push_back(cur);
    std::reverse(pathF.begin(), pathF.end());
    for (int cur = pB[meet]; cur != -1 && cur != end;   cur = pB[cur]) pathB.push_back(cur);
    pathF.push_back(meet);
    pathF.insert(pathF.end(), pathB.begin(), pathB.end());
    return buildResult(order, pathF, true);
  };

  auto step = [&](MinPQ& pq, std::vector<float>& dist, std::vector<bool>& vis,
                  std::vector<bool>& otherVis, std::vector<int>& prev, int target) -> int {
    if (pq.empty()) return -1;
    auto [idx, d] = pq.top(); pq.pop();
    if (vis[idx]) return -1;
    vis[idx] = true; order.push_back(idx);
    if (otherVis[idx]) return idx;
    for (int nb : getNeighbors(idx, rows, cols, grid)) {
      float w = grid[nb] > 0 ? (float)grid[nb] : 1.0f;
      float nd = d + (w + 1.0f) * manhattan(nb, target, cols);
      if (nd < dist[nb]) { dist[nb] = nd; prev[nb] = idx; pq.push({nb, nd}); }
    }
    return -1;
  };

  while (!pqF.empty() || !pqB.empty()) {
    int m = step(pqF, dF, vF, vB, pF, end);
    if (m >= 0) return buildBiPath(m);
    m = step(pqB, dB, vB, vF, pB, start);
    if (m >= 0) return buildBiPath(m);
  }
  return buildResult(order, {}, false);
}

// ─── BFS ──────────────────────────────────────────────────────────────────────
// Guaranteed shortest path (unweighted). FIFO queue. O(V+E).
static std::string bfs_impl(const std::vector<int>& grid,
                              int rows, int cols,
                              int sr, int sc, int er, int ec) {
  const int n = rows * cols, start = sr*cols+sc, end = er*cols+ec;
  std::vector<bool> vis(n, false);
  std::vector<int>  prev(n, -1), order; order.reserve(n);

  std::deque<int> queue;
  queue.push_back(start); vis[start] = true;

  while (!queue.empty()) {
    int idx = queue.front(); queue.pop_front();
    order.push_back(idx);
    if (idx == end) return buildResult(order, reconstructPath(prev, start, end), true);
    for (int nb : getNeighbors(idx, rows, cols, grid))
      if (!vis[nb]) { vis[nb] = true; prev[nb] = idx; queue.push_back(nb); }
  }
  return buildResult(order, {}, false);
}

// ─── DFS ──────────────────────────────────────────────────────────────────────
// NOT guaranteed shortest. Iterative stack. O(V+E).
static std::string dfs_impl(const std::vector<int>& grid,
                              int rows, int cols,
                              int sr, int sc, int er, int ec) {
  const int n = rows * cols, start = sr*cols+sc, end = er*cols+ec;
  std::vector<bool> vis(n, false);
  std::vector<int>  prev(n, -1), order, stack; order.reserve(n); stack.reserve(n);
  stack.push_back(start);

  while (!stack.empty()) {
    int idx = stack.back(); stack.pop_back();
    if (vis[idx]) continue;
    vis[idx] = true; order.push_back(idx);
    if (idx == end) return buildResult(order, reconstructPath(prev, start, end), true);
    for (int nb : getNeighbors(idx, rows, cols, grid))
      if (!vis[nb]) { prev[nb] = idx; stack.push_back(nb); }
  }
  return buildResult(order, {}, false);
}

// ─── Grid parser ──────────────────────────────────────────────────────────────
static std::vector<int> parseGrid(const std::string& data) {
  std::vector<int> grid;
  std::istringstream ss(data);
  std::string tok;
  while (std::getline(ss, tok, ','))
    if (!tok.empty()) grid.push_back(std::stoi(tok));
  return grid;
}

// ─── Public API ───────────────────────────────────────────────────────────────
std::string run_dijkstra   (const std::string& g, int r, int c, int sr, int sc, int er, int ec) { return dijkstra_impl(parseGrid(g), r, c, sr, sc, er, ec); }
std::string run_astar      (const std::string& g, int r, int c, int sr, int sc, int er, int ec) { return astar_impl   (parseGrid(g), r, c, sr, sc, er, ec); }
std::string run_greedy     (const std::string& g, int r, int c, int sr, int sc, int er, int ec) { return greedy_impl  (parseGrid(g), r, c, sr, sc, er, ec); }
std::string run_swarm      (const std::string& g, int r, int c, int sr, int sc, int er, int ec) { return swarm_impl   (parseGrid(g), r, c, sr, sc, er, ec, false); }
std::string run_convergent (const std::string& g, int r, int c, int sr, int sc, int er, int ec) { return swarm_impl   (parseGrid(g), r, c, sr, sc, er, ec, true); }
std::string run_biswarm    (const std::string& g, int r, int c, int sr, int sc, int er, int ec) { return biSwarm_impl (parseGrid(g), r, c, sr, sc, er, ec); }
std::string run_bfs        (const std::string& g, int r, int c, int sr, int sc, int er, int ec) { return bfs_impl     (parseGrid(g), r, c, sr, sc, er, ec); }
std::string run_dfs        (const std::string& g, int r, int c, int sr, int sc, int er, int ec) { return dfs_impl     (parseGrid(g), r, c, sr, sc, er, ec); }

// ─── Emscripten bindings ──────────────────────────────────────────────────────
#ifdef __EMSCRIPTEN__
EMSCRIPTEN_BINDINGS(pathfinder_module) {
  emscripten::function("run_dijkstra",   &run_dijkstra);
  emscripten::function("run_astar",      &run_astar);
  emscripten::function("run_greedy",     &run_greedy);
  emscripten::function("run_swarm",      &run_swarm);
  emscripten::function("run_convergent", &run_convergent);
  emscripten::function("run_biswarm",    &run_biswarm);
  emscripten::function("run_bfs",        &run_bfs);
  emscripten::function("run_dfs",        &run_dfs);
}
#endif
