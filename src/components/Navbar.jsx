import React, { useState } from 'react';

const ALGORITHMS = [
  { id: 'dijkstra',      label: "Dijkstra's",           weighted: true,  guaranteed: true  },
  { id: 'astar',         label: 'A* Search',             weighted: true,  guaranteed: true  },
  { id: 'greedy',        label: 'Greedy Best-First',     weighted: true,  guaranteed: false },
  { id: 'swarm',         label: 'Swarm',                 weighted: true,  guaranteed: false },
  { id: 'convergent',    label: 'Convergent Swarm',      weighted: true,  guaranteed: false },
  { id: 'bidirectional', label: 'Bidirectional Swarm',   weighted: true,  guaranteed: false },
  { id: 'bfs',           label: 'Breadth-First Search',  weighted: false, guaranteed: true  },
  { id: 'dfs',           label: 'Depth-First Search',    weighted: false, guaranteed: false },
];

const MAZES = [
  { id: 'recursive', label: 'Recursive Division' },
  { id: 'random',    label: 'Random Walls'       },
  { id: 'weights',   label: 'Random Weights'     },
];

export default function Navbar({
  algorithm, setAlgorithm,
  speed, setSpeed,
  isRunning,
  mouseMode, setMouseMode,
  onRun, onClearPath, onClearWalls, onReset,
  onMaze, stats,
  theme, onToggleTheme,
  onOpenTutorial,
}) {
  const [algoOpen,  setAlgoOpen]  = useState(false);
  const [mazeOpen,  setMazeOpen]  = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);

  const currentAlgo = ALGORITHMS.find(a => a.id === algorithm);
  const close = () => { setAlgoOpen(false); setMazeOpen(false); setSpeedOpen(false); };

  return (
    <nav className="navbar" onClick={close}>

      {/* Brand */}
      <span className="nav-brand">Pathfinding Visualizer</span>

      {/* ── Algorithm Picker ─────────────────────────────────────── */}
      <div className="nav-dropdown" onClick={e => e.stopPropagation()}>
        <button
          className="nav-btn dropdown-trigger"
          onClick={() => { setAlgoOpen(o => !o); setMazeOpen(false); setSpeedOpen(false); }}
          disabled={isRunning}
        >
          Algorithms <span className="caret">▾</span>
        </button>
        {algoOpen && (
          <div className="dropdown-menu">
            {ALGORITHMS.map(a => (
              <button
                key={a.id}
                className={`dropdown-item ${algorithm === a.id ? 'active' : ''}`}
                onClick={() => { setAlgorithm(a.id); close(); }}
              >
                {a.label}
                <span className="algo-tags">
                  <span className={`tag ${a.weighted ? 'tag-weighted' : 'tag-unweighted'}`}
                        title={a.weighted ? 'Weighted — respects cell costs' : 'Unweighted — ignores cell costs'}>
                    {a.weighted ? 'W' : 'U'}
                  </span>
                  <span className={`tag ${a.guaranteed ? 'tag-guaranteed' : 'tag-no-guarantee'}`}
                        title={a.guaranteed ? 'Guarantees shortest path' : 'Does NOT guarantee shortest path'}>
                    {a.guaranteed ? '✓' : '✗'}
                  </span>
                </span>
              </button>
            ))}

            {/* Icon legend inside dropdown */}
            <div className="dropdown-divider" />
            <div className="dropdown-icon-legend">
              <div className="dil-row">
                <span className="tag tag-weighted">W</span>
                <span>Weighted — algorithm accounts for cell costs (e.g. weight nodes cost ×15)</span>
              </div>
              <div className="dil-row">
                <span className="tag tag-unweighted">U</span>
                <span>Unweighted — all moves treated equally; weight nodes are ignored</span>
              </div>
              <div className="dil-row">
                <span className="tag tag-guaranteed">✓</span>
                <span>Guarantees the shortest possible path</span>
              </div>
              <div className="dil-row">
                <span className="tag tag-no-guarantee">✗</span>
                <span>Does NOT guarantee shortest path — trades accuracy for speed</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Maze Picker ──────────────────────────────────────────── */}
      <div className="nav-dropdown" onClick={e => e.stopPropagation()}>
        <button
          className="nav-btn dropdown-trigger"
          onClick={() => { setMazeOpen(o => !o); setAlgoOpen(false); setSpeedOpen(false); }}
          disabled={isRunning}
        >
          Mazes <span className="caret">▾</span>
        </button>
        {mazeOpen && (
          <div className="dropdown-menu">
            {MAZES.map(m => (
              <button key={m.id} className="dropdown-item" onClick={() => { onMaze(m.id); close(); }}>
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Mouse Mode Toggle ────────────────────────────────────── */}
      <button
        className={`nav-btn mode-toggle ${mouseMode === 'weight' ? 'active-weight' : ''}`}
        onClick={() => setMouseMode(m => m === 'wall' ? 'weight' : 'wall')}
        title={mouseMode === 'wall'
          ? 'Currently drawing Walls. Click to switch to Weights.'
          : 'Currently drawing Weights. Click to switch to Walls.'}
        disabled={isRunning}
      >
        {mouseMode === 'wall' ? '🧱 Wall' : '⚖️ Weight'}
      </button>

      {/* ── Speed Picker ─────────────────────────────────────────── */}
      <div className="nav-dropdown" onClick={e => e.stopPropagation()}>
        <button
          className="nav-btn dropdown-trigger"
          onClick={() => { setSpeedOpen(o => !o); setAlgoOpen(false); setMazeOpen(false); }}
          disabled={isRunning}
        >
          Speed: {speed.charAt(0).toUpperCase() + speed.slice(1)} <span className="caret">▾</span>
        </button>
        {speedOpen && (
          <div className="dropdown-menu">
            {['fast', 'medium', 'slow'].map(s => (
              <button
                key={s}
                className={`dropdown-item ${speed === s ? 'active' : ''}`}
                onClick={() => { setSpeed(s); close(); }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Action buttons ───────────────────────────────────────── */}
      <button className="nav-btn btn-clear"  onClick={onClearPath}  disabled={isRunning}>Clear Path</button>
      <button className="nav-btn btn-clear"  onClick={onClearWalls} disabled={isRunning}>Clear Walls</button>
      <button className="nav-btn btn-reset"  onClick={onReset}      disabled={isRunning}>Reset</button>

      {/* ── Visualize ────────────────────────────────────────────── */}
      <button className="nav-btn btn-visualize" onClick={onRun} disabled={isRunning}>
        {isRunning ? '⏳ Running…' : `▶ Visualize ${currentAlgo?.label || ''}`}
      </button>

      {/* ── Stats chip ───────────────────────────────────────────── */}
      {stats && (
        <div className={`stats-chip ${stats.success ? 'stats-ok' : 'stats-fail'}`}>
          {stats.success
            ? `✓ ${stats.pathLen} steps · ${stats.visited} visited`
            : '✗ No path found'}
        </div>
      )}

      {/* ── Right-side utility buttons ───────────────────────────── */}
      <div className="nav-util">
        <button
          className="nav-icon-btn"
          onClick={onOpenTutorial}
          title="Open tutorial"
        >?</button>
        <button
          className="nav-icon-btn theme-toggle"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
