"use client";

import { useEffect, useMemo, useState } from "react";

type Wall = {
  id: string;
  x: number;
  y: number;
  length: number;
  angle: number;
  height: number;
  thickness: number;
};

const seedWalls: Wall[] = [
  { id: "W-001", x: 120, y: 100, length: 320, angle: 0, height: 96, thickness: 8 },
  { id: "W-002", x: 440, y: 100, length: 220, angle: 90, height: 96, thickness: 8 },
  { id: "W-003", x: 440, y: 320, length: 320, angle: 180, height: 96, thickness: 8 },
  { id: "W-004", x: 120, y: 100, length: 220, angle: 90, height: 96, thickness: 8 },
];

function uid() {
  return `W-${String(Date.now()).slice(-4)}`;
}

export default function EditorPage() {
  const [walls, setWalls] = useState<Wall[]>(seedWalls);
  const [selected, setSelected] = useState("W-001");
  const [history, setHistory] = useState<Wall[][]>([]);
  const [future, setFuture] = useState<Wall[][]>([]);
  const [command, setCommand] = useState("");
  const [message, setMessage] = useState("Nexus ready — structural model loaded.");

  useEffect(() => {
    const raw = window.localStorage.getItem("soulty-editor-model");
    if (raw) {
      try { setWalls(JSON.parse(raw)); } catch {}
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("soulty-editor-model", JSON.stringify(walls));
  }, [walls]);

  const active = walls.find((w) => w.id === selected) ?? null;

  function commit(next: Wall[]) {
    setHistory((h) => [...h.slice(-29), walls]);
    setFuture([]);
    setWalls(next);
  }

  function updateActive(patch: Partial<Wall>) {
    if (!active) return;
    commit(walls.map((w) => w.id === active.id ? { ...w, ...patch } : w));
  }

  function addWall() {
    const wall: Wall = { id: uid(), x: 250, y: 210, length: 180, angle: 0, height: 96, thickness: 8 };
    commit([...walls, wall]);
    setSelected(wall.id);
    setMessage(`Created ${wall.id}. Drag it or edit its properties.`);
  }

  function removeWall() {
    if (!active) return;
    commit(walls.filter((w) => w.id !== active.id));
    setSelected(walls.find((w) => w.id !== active.id)?.id ?? "");
    setMessage(`Removed ${active.id}.`);
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((f) => [...f, walls]);
    setWalls(previous);
    setHistory((h) => h.slice(0, -1));
  }

  function redo() {
    const next = future.at(-1);
    if (!next) return;
    setHistory((h) => [...h, walls]);
    setWalls(next);
    setFuture((f) => f.slice(0, -1));
  }

  function runNexus() {
    const text = command.trim().toLowerCase();
    if (!text) return;
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:ft|feet|')?/);
    if (text.includes("add") && text.includes("wall")) {
      addWall();
      setMessage("Nexus action: createWall() committed to the same model.");
      setCommand("");
      return;
    }
    if (text.includes("delete") || text.includes("remove")) {
      removeWall();
      setMessage("Nexus action: deleteWall() committed to the same model.");
      setCommand("");
      return;
    }
    if (text.includes("longer") && match && active) {
      const length = Number(match[1]) * 12;
      updateActive({ length });
      setMessage(`Nexus action: ${active.id} length set to ${length} in.`);
      setCommand("");
      return;
    }
    setMessage("Nexus understood the request, but this prototype only commits add wall, delete wall, and length changes.");
  }

  const roomArea = useMemo(() => {
    const xs = walls.flatMap((w) => [w.x, w.x + w.length * Math.cos(w.angle * Math.PI / 180)]);
    const ys = walls.flatMap((w) => [w.y, w.y + w.length * Math.sin(w.angle * Math.PI / 180)]);
    if (!xs.length) return 0;
    return Math.max(0, Math.round(((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))) / 144));
  }, [walls]);

  return (
    <main className="soulty-shell">
      <header className="topbar">
        <div>
          <div className="brand">SOULTY <span>ONE</span></div>
          <div className="subtitle">MODULAR STRUCTURAL BUILDING PLATFORM</div>
        </div>
        <div className="top-actions">
          <button onClick={undo} disabled={!history.length}>Undo</button>
          <button onClick={redo} disabled={!future.length}>Redo</button>
          <button className="primary" onClick={addWall}>+ Wall</button>
        </div>
      </header>

      <section className="workspace">
        <aside className="left-panel">
          <div className="panel-title">PROJECT</div>
          <h1>Prototype 01</h1>
          <div className="status"><span /> LIVE LOCAL MODEL</div>
          <div className="stat-grid">
            <div><b>{walls.length}</b><small>WALLS</small></div>
            <div><b>{roomArea}</b><small>EST. SQ FT</small></div>
          </div>
          <div className="panel-title">TOOLS</div>
          <button className="tool active">▧ Select / Move</button>
          <button className="tool" onClick={addWall}>＋ Add Wall</button>
          <button className="tool" onClick={() => setMessage("Structural validation: prototype geometry is editable; engineering checks are not yet certified.")}>✓ Validate</button>
          <div className="panel-title">NEXUS</div>
          <div className="nexus-note">{message}</div>
        </aside>

        <section className="canvas-wrap">
          <div className="canvas-toolbar">
            <span>TOP / PLAN</span>
            <span>GRID 12&quot;</span>
            <span>SNAP ON</span>
          </div>
          <svg className="plan" viewBox="0 0 900 520" role="img" aria-label="Interactive structural plan">
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(180,150,90,.16)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="900" height="520" fill="url(#grid)" />
            <line x1="40" y1="470" x2="120" y2="470" stroke="#d7b56d" strokeWidth="2" />
            <text x="45" y="492" fill="#9b875f" fontSize="12">12 FT</text>
            {walls.map((w) => {
              const rad = w.angle * Math.PI / 180;
              const x2 = w.x + w.length * Math.cos(rad);
              const y2 = w.y + w.length * Math.sin(rad);
              const isActive = selected === w.id;
              return (
                <g key={w.id} onClick={() => setSelected(w.id)} style={{ cursor: "pointer" }}>
                  <line x1={w.x} y1={w.y} x2={x2} y2={y2}
                    stroke={isActive ? "#e5b95f" : "#f3efe6"}
                    strokeWidth={isActive ? 14 : 10} strokeLinecap="round" />
                  {isActive && <line x1={w.x} y1={w.y} x2={x2} y2={y2}
                    stroke="#8a6a2e" strokeWidth="2" strokeDasharray="8 5" />}
                  <text x={(w.x+x2)/2} y={(w.y+y2)/2-12} fill="#c8bfae" fontSize="11" textAnchor="middle">{w.id}</text>
                </g>
              );
            })}
            <text x="450" y="42" fill="#a98a4b" fontSize="12" textAnchor="middle">TRUE NORTH ↑</text>
          </svg>
          <div className="canvas-footer">MODEL SAVED LOCALLY • {walls.length} ELEMENTS • SELECT AN ELEMENT TO INSPECT</div>
        </section>

        <aside className="right-panel">
          <div className="panel-title">ELEMENT INSPECTOR</div>
          {active ? (
            <>
              <div className="element-id">{active.id}<span>WALL</span></div>
              {(["x","y","length","height","thickness"] as const).map((key) => (
                <label className="field" key={key}>
                  <span>{key.toUpperCase()}</span>
                  <input type="number" value={active[key]} onChange={(e) => updateActive({ [key]: Number(e.target.value) })} />
                </label>
              ))}
              <label className="field"><span>ANGLE</span>
                <input type="number" value={active.angle} onChange={(e) => updateActive({ angle: Number(e.target.value) })} />
              </label>
              <button className="danger" onClick={removeWall}>Delete Element</button>
            </>
          ) : <p className="empty">Select an element.</p>}

          <div className="panel-title nexus-head">NEXUS COPILOT</div>
          <div className="command-box">
            <input value={command} onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runNexus()} placeholder="e.g. add a wall" />
            <button onClick={runNexus}>Run</button>
          </div>
          <p className="hint">Prototype commands: “add a wall”, “delete wall”, or “make it 20 ft longer”.</p>
        </aside>
      </section>
    </main>
  );
}
