import React, { useState, useCallback, useRef, useEffect } from 'react';
import Grid from './components/Grid.jsx';
import Navbar from './components/Navbar.jsx';
import Legend from './components/Legend.jsx';
import Tutorial from './components/Tutorial.jsx';
import { runAlgorithm } from './algorithms/index.js';
import { recursiveDivisionMaze, randomMaze, randomWeights } from './maze/index.js';

const ROWS = 22;
const COLS = 52;
const START_ROW = 11;
const START_COL = 10;
const END_ROW = 11;
const END_COL = 41;

function createNode(row, col) {
  return {
    row, col,
    type: row === START_ROW && col === START_COL ? 'start'
        : row === END_ROW   && col === END_COL   ? 'end'
        : 'empty',
    weight: 0,
  };
}

function buildGrid() {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => createNode(r, c))
  );
}

const SPEEDS = { fast: 8, medium: 30, slow: 80 };

export default function App() {
  const [grid, setGrid]             = useState(buildGrid);
  const [startPos, setStartPos]     = useState({ row: START_ROW, col: START_COL });
  const [endPos, setEndPos]         = useState({ row: END_ROW,   col: END_COL   });
  const [algorithm, setAlgorithm]   = useState('astar');
  const [speed, setSpeed]           = useState('fast');
  const [isRunning, setIsRunning]   = useState(false);
  const [isDone, setIsDone]         = useState(false);
  const [stats, setStats]           = useState(null);
  const [mouseMode, setMouseMode]   = useState('wall');
  const [theme, setTheme]           = useState('dark');   // 'dark' | 'light'
  const [showTutorial, setShowTutorial] = useState(true); // auto-open on first load
  const timersRef                   = useRef([]);

  // Apply theme class to <html> so CSS variables cascade everywhere
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  // ── Clear functions ──────────────────────────────────────────────────────
  const clearPath = useCallback(() => {
    clearTimers();
    setIsDone(false);
    setStats(null);
    setGrid(g => g.map(r => r.map(n => {
      if (n.type === 'visited' || n.type === 'path') return { ...n, type: 'empty' };
      return { ...n };
    })));
  }, []);

  const clearWalls = useCallback(() => {
    clearPath();
    setGrid(g => g.map(r => r.map(n => {
      if (n.type === 'wall' || n.weight > 0) return { ...n, type: 'empty', weight: 0 };
      return { ...n };
    })));
  }, [clearPath]);

  const resetBoard = useCallback(() => {
    clearTimers();
    setIsDone(false);
    setStats(null);
    setStartPos({ row: START_ROW, col: START_COL });
    setEndPos({ row: END_ROW, col: END_COL });
    setGrid(buildGrid());
  }, []);

  // ── Maze generators ──────────────────────────────────────────────────────
  const generateMaze = useCallback((type) => {
    if (isRunning) return;
    clearPath();
    setGrid(g => {
      const fresh = g.map(r => r.map(n => {
        if (n.type === 'wall' || n.weight > 0) return { ...n, type: 'empty', weight: 0 };
        return { ...n };
      }));
      let walls = [];
      if (type === 'recursive')    walls = recursiveDivisionMaze(fresh, ROWS, COLS);
      else if (type === 'random')  walls = randomMaze(fresh, ROWS, COLS);
      else if (type === 'weights') walls = randomWeights(fresh, ROWS, COLS);

      const next = fresh.map(r => r.map(n => ({ ...n })));
      walls.forEach(([r, c, w]) => {
        if (next[r][c].type === 'empty') {
          if (w) { next[r][c].weight = 15; }
          else   { next[r][c].type = 'wall'; }
        }
      });
      return next;
    });
  }, [isRunning, clearPath]);

  // ── Run algorithm ────────────────────────────────────────────────────────
  const runVisualization = useCallback(() => {
    if (isRunning) return;
    clearPath();

    setTimeout(() => {
      setGrid(g => {
        const snap = g.map(r => r.map(n => ({ ...n })));
        const { visitedOrder, path, success } = runAlgorithm(
          algorithm, null,
          snap, ROWS, COLS,
          startPos.row, startPos.col,
          endPos.row, endPos.col
        );

        const delay = SPEEDS[speed];
        setIsRunning(true);
        clearTimers();

        visitedOrder.forEach(({ row, col }, i) => {
          const t = setTimeout(() => {
            setGrid(prev => {
              const n = prev.map(r => r.map(x => ({ ...x })));
              if (n[row][col].type === 'empty') n[row][col].type = 'visited';
              return n;
            });
          }, i * delay);
          timersRef.current.push(t);
        });

        const pathStart = visitedOrder.length * delay;
        if (success) {
          path.forEach(({ row, col }, i) => {
            const t = setTimeout(() => {
              setGrid(prev => {
                const n = prev.map(r => r.map(x => ({ ...x })));
                if (n[row][col].type !== 'start' && n[row][col].type !== 'end')
                  n[row][col].type = 'path';
                return n;
              });
            }, pathStart + i * (delay * 2.5));
            timersRef.current.push(t);
          });
        }

        const totalTime = pathStart + (success ? path.length * delay * 2.5 : 0) + delay;
        const t = setTimeout(() => {
          setIsRunning(false);
          setIsDone(true);
          setStats({ visited: visitedOrder.length, pathLen: path.length, success });
        }, totalTime);
        timersRef.current.push(t);

        return snap;
      });
    }, 50);
  }, [isRunning, algorithm, speed, startPos, endPos, clearPath]);

  // Instant redo when dragging start/end after algo done
  const redoInstant = useCallback((newGrid, newStart, newEnd) => {
    clearTimers();
    const clean = newGrid.map(r => r.map(n => {
      if (n.type === 'visited' || n.type === 'path') return { ...n, type: 'empty' };
      return { ...n };
    }));
    const { visitedOrder, path, success } = runAlgorithm(
      algorithm, null,
      clean, ROWS, COLS,
      newStart.row, newStart.col,
      newEnd.row,   newEnd.col
    );
    const next = clean.map(r => r.map(n => ({ ...n })));
    visitedOrder.forEach(({ row, col }) => {
      if (next[row][col].type === 'empty') next[row][col].type = 'visited';
    });
    if (success) path.forEach(({ row, col }) => {
      if (next[row][col].type !== 'start' && next[row][col].type !== 'end')
        next[row][col].type = 'path';
    });
    setGrid(next);
    setStats({ visited: visitedOrder.length, pathLen: path.length, success });
  }, [algorithm]);

  return (
    <div className="app-shell">
      <Navbar
        algorithm={algorithm}
        setAlgorithm={setAlgorithm}
        speed={speed}
        setSpeed={setSpeed}
        isRunning={isRunning}
        isDone={isDone}
        mouseMode={mouseMode}
        setMouseMode={setMouseMode}
        onRun={runVisualization}
        onClearPath={clearPath}
        onClearWalls={clearWalls}
        onReset={resetBoard}
        onMaze={generateMaze}
        stats={stats}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        onOpenTutorial={() => setShowTutorial(true)}
      />
      <main className="grid-area">
        <Grid
          grid={grid}
          setGrid={setGrid}
          startPos={startPos}
          setStartPos={setStartPos}
          endPos={endPos}
          setEndPos={setEndPos}
          isRunning={isRunning}
          isDone={isDone}
          mouseMode={mouseMode}
          onDragComplete={isDone ? redoInstant : null}
        />
      </main>
      <Legend algorithm={algorithm} />

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}
