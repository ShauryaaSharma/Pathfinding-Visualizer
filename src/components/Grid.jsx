import React, { useRef, useState, useCallback } from 'react';

const TYPE_CLASS = {
  empty:   'cell-empty',
  wall:    'cell-wall',
  visited: 'cell-visited',
  path:    'cell-path',
  start:   'cell-start',
  end:     'cell-end',
};

export default function Grid({
  grid, setGrid,
  startPos, setStartPos,
  endPos, setEndPos,
  isRunning, isDone,
  mouseMode,
  onDragComplete,
}) {
  const isMouseDown    = useRef(false);
  const dragTarget     = useRef(null); // 'start' | 'end' | null
  const [dragging, setDragging] = useState(null);

  const getNode = (r, c) => grid[r]?.[c];

  const applyPaint = useCallback((r, c) => {
    const node = getNode(r, c);
    if (!node) return;
    if (node.type === 'start' || node.type === 'end') return;

    setGrid(prev => {
      const next = prev.map(row => row.map(n => ({ ...n })));
      const cell = next[r][c];
      if (mouseMode === 'wall') {
        if (cell.type === 'wall') { cell.type = 'empty'; cell.weight = 0; }
        else { cell.type = 'wall'; cell.weight = 0; }
      } else {
        if (cell.weight === 15) { cell.weight = 0; }
        else { cell.weight = 15; cell.type = 'empty'; }
      }
      return next;
    });
  }, [mouseMode, setGrid]);

  const handleMouseDown = (r, c) => (e) => {
    if (isRunning) return;
    e.preventDefault();
    isMouseDown.current = true;
    const node = getNode(r, c);
    if (node.type === 'start') { dragTarget.current = 'start'; setDragging('start'); }
    else if (node.type === 'end') { dragTarget.current = 'end'; setDragging('end'); }
    else { dragTarget.current = null; applyPaint(r, c); }
  };

  const handleMouseEnter = (r, c) => () => {
    if (!isMouseDown.current || isRunning) return;
    if (dragTarget.current === 'start') {
      const node = getNode(r, c);
      if (node.type === 'end') return;
      setGrid(prev => {
        const next = prev.map(row => row.map(n => ({ ...n })));
        next[startPos.row][startPos.col].type = 'empty';
        next[r][c].type = 'start';
        return next;
      });
      setStartPos({ row: r, col: c });
    } else if (dragTarget.current === 'end') {
      const node = getNode(r, c);
      if (node.type === 'start') return;
      setGrid(prev => {
        const next = prev.map(row => row.map(n => ({ ...n })));
        next[endPos.row][endPos.col].type = 'empty';
        next[r][c].type = 'end';
        return next;
      });
      setEndPos({ row: r, col: c });
    } else {
      applyPaint(r, c);
    }
  };

  const handleMouseUp = (r, c) => () => {
    isMouseDown.current = false;
    if (dragTarget.current && isDone && onDragComplete) {
      const ns = dragTarget.current === 'start' ? { row: r, col: c } : startPos;
      const ne = dragTarget.current === 'end'   ? { row: r, col: c } : endPos;
      onDragComplete(grid, ns, ne);
    }
    dragTarget.current = null;
    setDragging(null);
  };

  return (
    <div
      className={`grid-container ${dragging ? 'dragging-' + dragging : ''}`}
      onMouseLeave={() => { isMouseDown.current = false; dragTarget.current = null; setDragging(null); }}
    >
      {grid.map((row, r) => (
        <div key={r} className="grid-row">
          {row.map((node, c) => {
            let cls = TYPE_CLASS[node.type] || 'cell-empty';
            if (node.weight === 15 && node.type !== 'wall' && node.type !== 'start' && node.type !== 'end') {
              cls += ' cell-weight';
            }
            return (
              <div
                key={c}
                className={`cell ${cls}`}
                onMouseDown={handleMouseDown(r, c)}
                onMouseEnter={handleMouseEnter(r, c)}
                onMouseUp={handleMouseUp(r, c)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
