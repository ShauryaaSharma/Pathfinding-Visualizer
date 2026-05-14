import React, { useState } from 'react';

const STEPS = [
  {
    title: 'Welcome to Pathfinding Visualizer!',
    icon: '🗺️',
    content: (
      <>
        <p>This tool lets you <strong>visualize 8 different pathfinding algorithms</strong> on a live interactive grid.</p>
        <p>Watch algorithms explore the grid in real time and find the shortest path between two points.</p>
        <p>This quick tour will walk you through everything. Press <strong>Next</strong> to continue.</p>
      </>
    ),
  },
  {
    title: 'The Grid',
    icon: '📐',
    content: (
      <>
        <p>The grid is made up of cells. Each cell can be one of the following:</p>
        <div className="tour-legend">
          <div className="tour-legend-row">
            <span className="tl-swatch" style={{ background:'#00ffa3', borderRadius:'50%' }} />
            <div><strong>Start Node</strong> — where the algorithm begins. Drag it anywhere.</div>
          </div>
          <div className="tour-legend-row">
            <span className="tl-swatch" style={{ background:'#ff4d6d', transform:'rotate(45deg)', borderRadius:'3px' }} />
            <div><strong>End Node</strong> — the destination. Drag it anywhere.</div>
          </div>
          <div className="tour-legend-row">
            <span className="tl-swatch" style={{ background:'#1e2535', border:'1px solid #3a4a60' }} />
            <div><strong>Empty Cell</strong> — freely traversable with cost 1.</div>
          </div>
          <div className="tour-legend-row">
            <span className="tl-swatch" style={{ background:'#0d1117' }} />
            <div><strong>Wall</strong> — completely blocks movement. Impassable.</div>
          </div>
          <div className="tour-legend-row">
            <span className="tl-swatch" style={{ background:'#6d28d9' }} />
            <div><strong>Weight</strong> — passable, but costs 15× more to traverse.</div>
          </div>
          <div className="tour-legend-row">
            <span className="tl-swatch" style={{ background:'#0077aa' }} />
            <div><strong>Visited</strong> — cells explored by the algorithm during search.</div>
          </div>
          <div className="tour-legend-row">
            <span className="tl-swatch" style={{ background:'#ffd166' }} />
            <div><strong>Shortest Path</strong> — the optimal route found (if any).</div>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'Drawing on the Grid',
    icon: '✏️',
    content: (
      <>
        <p><strong>Click or click-and-drag</strong> on any empty cell to draw a wall. Click a wall to erase it.</p>
        <p>Use the <strong>🧱 Wall / ⚖️ Weight</strong> toggle in the navbar to switch between drawing walls and weight nodes.</p>
        <p><strong>Drag</strong> the green Start or red End node to reposition them anywhere on the grid.</p>
        <div className="tour-tip">💡 After running an algorithm, dragging Start or End will <strong>instantly re-run</strong> and update the result!</div>
      </>
    ),
  },
  {
    title: 'Picking an Algorithm',
    icon: '🧠',
    content: (
      <>
        <p>Click the <strong>Algorithms</strong> dropdown to choose one of 8 algorithms.</p>
        <div className="tour-algo-grid">
          <div className="tour-algo-row"><span className="tag tag-weighted">W</span><span className="tag tag-guaranteed">✓</span><span>Dijkstra's — weighted, guaranteed shortest path</span></div>
          <div className="tour-algo-row"><span className="tag tag-weighted">W</span><span className="tag tag-guaranteed">✓</span><span>A* Search — weighted + heuristic, guaranteed fastest</span></div>
          <div className="tour-algo-row"><span className="tag tag-weighted">W</span><span className="tag tag-no-guarantee">✗</span><span>Greedy Best-First — heuristic only, very fast</span></div>
          <div className="tour-algo-row"><span className="tag tag-weighted">W</span><span className="tag tag-no-guarantee">✗</span><span>Swarm — blend of Dijkstra + heuristic</span></div>
          <div className="tour-algo-row"><span className="tag tag-weighted">W</span><span className="tag tag-no-guarantee">✗</span><span>Convergent Swarm — heavily heuristic-weighted</span></div>
          <div className="tour-algo-row"><span className="tag tag-weighted">W</span><span className="tag tag-no-guarantee">✗</span><span>Bidirectional Swarm — searches from both ends</span></div>
          <div className="tour-algo-row"><span className="tag tag-unweighted">U</span><span className="tag tag-guaranteed">✓</span><span>BFS — unweighted, guaranteed shortest path</span></div>
          <div className="tour-algo-row"><span className="tag tag-unweighted">U</span><span className="tag tag-no-guarantee">✗</span><span>DFS — unweighted, explores deeply, not optimal</span></div>
        </div>
        <div className="tour-tag-key">
          <span><span className="tag tag-weighted">W</span> = Weighted (respects cell costs)</span>
          <span><span className="tag tag-unweighted">U</span> = Unweighted (ignores weights)</span>
          <span><span className="tag tag-guaranteed">✓</span> = Guarantees shortest path</span>
        </div>
      </>
    ),
  },
  {
    title: 'Mazes & Patterns',
    icon: '🌀',
    content: (
      <>
        <p>Click the <strong>Mazes</strong> dropdown to auto-generate an obstacle pattern:</p>
        <div className="tour-list">
          <div><strong>Recursive Division</strong> — splits the grid recursively with passages, creating a perfect maze.</div>
          <div><strong>Random Walls</strong> — scatters walls randomly across ~28% of the grid.</div>
          <div><strong>Random Weights</strong> — fills ~30% of the grid with expensive weight nodes.</div>
        </div>
        <div className="tour-tip">💡 Maze generation clears any existing path automatically before building the new pattern.</div>
      </>
    ),
  },
  {
    title: 'Controls & Speed',
    icon: '⚙️',
    content: (
      <>
        <p>The navbar gives you full control over the visualization:</p>
        <div className="tour-list">
          <div><strong>Speed dropdown</strong> — Fast, Medium, or Slow animation speed.</div>
          <div><strong>Clear Path</strong> — removes only the visited/path overlay, keeping walls and weights.</div>
          <div><strong>Clear Walls</strong> — removes all walls and weights, keeps path nodes.</div>
          <div><strong>Reset</strong> — wipes the entire board back to its initial state.</div>
        </div>
        <p>Once you've set up your grid and chosen an algorithm, hit the glowing <strong>▶ Visualize</strong> button!</p>
      </>
    ),
  },
  {
    title: "You're Ready!",
    icon: '🚀',
    content: (
      <>
        <p>That's everything you need to know. Here's a quick cheat sheet:</p>
        <div className="tour-list">
          <div>1. <strong>Pick an algorithm</strong> from the dropdown.</div>
          <div>2. <strong>Draw walls or weights</strong> on the grid (optional).</div>
          <div>3. <strong>Drag</strong> start/end nodes to position them.</div>
          <div>4. Hit <strong>▶ Visualize</strong> and watch it go!</div>
          <div>5. Open this tour again anytime via the <strong>?</strong> button.</div>
        </div>
        <div className="tour-tip">🎉 Have fun exploring how different algorithms behave on the same grid!</div>
      </>
    ),
  },
];

export default function Tutorial({ onClose }) {
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const current = STEPS[step];

  return (
    <div className="tour-overlay" onClick={onClose}>
      <div className="tour-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="tour-header">
          <span className="tour-icon">{current.icon}</span>
          <div className="tour-header-text">
            <div className="tour-step-count">Step {step + 1} of {total}</div>
            <h2 className="tour-title">{current.title}</h2>
          </div>
          <button className="tour-close" onClick={onClose}>✕</button>
        </div>

        {/* Progress bar */}
        <div className="tour-progress-track">
          <div className="tour-progress-fill" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>

        {/* Step dots */}
        <div className="tour-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`tour-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        {/* Content */}
        <div className="tour-body">{current.content}</div>

        {/* Footer nav */}
        <div className="tour-footer">
          <button className="tour-btn tour-btn-ghost" onClick={onClose}>Skip Tour</button>
          <div className="tour-nav">
            <button
              className="tour-btn tour-btn-secondary"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
            >← Prev</button>
            {step < total - 1 ? (
              <button className="tour-btn tour-btn-primary" onClick={() => setStep(s => s + 1)}>
                Next →
              </button>
            ) : (
              <button className="tour-btn tour-btn-primary" onClick={onClose}>
                Let's Go! 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
