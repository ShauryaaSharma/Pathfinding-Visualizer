import React from 'react';

const ALGO_INFO = {
  dijkstra:      { label: "Dijkstra's Algorithm",     weighted: true,  guaranteed: true,  desc: "Explores by cost — guarantees shortest path in weighted graphs." },
  astar:         { label: 'A* Search',                weighted: true,  guaranteed: true,  desc: "Heuristic-guided Dijkstra — fastest guaranteed shortest path." },
  greedy:        { label: 'Greedy Best-First',        weighted: true,  guaranteed: false, desc: "Always moves toward the target — very fast but not always optimal." },
  swarm:         { label: 'Swarm Algorithm',          weighted: true,  guaranteed: false, desc: "Blends distance + heuristic — middle-ground between Dijkstra and A*." },
  convergent:    { label: 'Convergent Swarm',         weighted: true,  guaranteed: false, desc: "Heavy heuristic weighting — focuses tightly on the target." },
  bidirectional: { label: 'Bidirectional Swarm',      weighted: true,  guaranteed: false, desc: "Searches from both ends simultaneously." },
  bfs:           { label: 'Breadth-First Search',     weighted: false, guaranteed: true,  desc: "Level-by-level — guarantees shortest path in unweighted graphs." },
  dfs:           { label: 'Depth-First Search',       weighted: false, guaranteed: false, desc: "Dives deep — fast but poor shortest-path quality." },
};

export default function Legend({ algorithm }) {
  const info = ALGO_INFO[algorithm] || {};
  return (
    <footer className="legend-bar">

      {/* ── Cell type swatches ───────────────────────────────────── */}
      <div className="legend-items">
        <div className="legend-item">
          <span className="legend-swatch swatch-start" />
          <span>Start</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-end" />
          <span>End</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-wall" />
          <span>Wall</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-weight" />
          <span>Weight (×15 cost)</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-visited" />
          <span>Visited</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-path" />
          <span>Shortest Path</span>
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="legend-divider" />

      {/* ── Icon key for algorithm tags ──────────────────────────── */}
      <div className="legend-icon-key">
        <span className="lik-label">Tag key:</span>
        <span className="lik-item">
          <span className="tag tag-weighted">W</span>
          <span className="lik-desc">Weighted</span>
        </span>
        <span className="lik-item">
          <span className="tag tag-unweighted">U</span>
          <span className="lik-desc">Unweighted</span>
        </span>
        <span className="lik-item">
          <span className="tag tag-guaranteed">✓</span>
          <span className="lik-desc">Shortest path guaranteed</span>
        </span>
        <span className="lik-item">
          <span className="tag tag-no-guarantee">✗</span>
          <span className="lik-desc">Not guaranteed</span>
        </span>
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="legend-divider" />

      {/* ── Active algorithm info ────────────────────────────────── */}
      <div className="legend-algo-info">
        <strong>{info.label}</strong>
        <span className={`legend-tag ${info.weighted ? 'tag-weighted' : 'tag-unweighted'}`}>
          {info.weighted ? 'W Weighted' : 'U Unweighted'}
        </span>
        <span className={`legend-tag ${info.guaranteed ? 'tag-guaranteed' : 'tag-no-guarantee'}`}>
          {info.guaranteed ? '✓ Guaranteed' : '✗ Not guaranteed'}
        </span>
        <span className="legend-desc">{info.desc}</span>
      </div>

    </footer>
  );
}
