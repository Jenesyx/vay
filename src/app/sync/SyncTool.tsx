"use client";

// Tap-to-sync: play the video, press SPACE (or the big button) the moment each
// line starts. Saves to src/lib/timings.json through /api/timings (dev only).

import { useCallback, useEffect, useRef, useState } from "react";
import { flatLines, song } from "@/lib/data";
import saved from "@/lib/timings.json";

const LATENCY = 0.12; // human reaction time, subtracted from each tap

export function SyncTool() {
  const video = useRef<HTMLVideoElement>(null);
  const [times, setTimes] = useState<(number | null)[]>(() =>
    flatLines.map((_, i) => (saved as { lines: (number | null)[] }).lines[i] ?? null),
  );
  const [ptr, setPtr] = useState(() => {
    const first = (saved as { lines: (number | null)[] }).lines.findIndex((t) => t === null);
    return first < 0 ? 0 : first;
  });
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState("");

  const tap = useCallback(() => {
    const v = video.current;
    if (!v || ptr >= flatLines.length) return;
    const t = Math.max(0, +(v.currentTime - LATENCY).toFixed(2));
    setTimes((ts) => ts.map((x, i) => (i === ptr ? t : x)));
    setPtr((p) => p + 1);
  }, [ptr]);

  const undo = useCallback(() => {
    setPtr((p) => {
      const n = Math.max(0, p - 1);
      setTimes((ts) => ts.map((x, i) => (i === n ? null : x)));
      return n;
    });
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        tap();
      }
      if (e.code === "Backspace") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [tap, undo]);

  useEffect(() => {
    if (video.current) video.current.playbackRate = rate;
  }, [rate]);

  const jumpTo = (i: number) => {
    setPtr(i);
    const v = video.current;
    if (!v) return;
    const prev = [...times.slice(0, i)].reverse().find((t) => t !== null);
    v.currentTime = Math.max(0, (times[i] ?? prev ?? 0) - 2);
  };

  const save = async () => {
    setStatus("saving…");
    const body = JSON.stringify({ lines: times }, null, 2);
    try {
      const r = await fetch("/api/timings", { method: "POST", headers: { "content-type": "application/json" }, body });
      setStatus(r.ok ? "saved to src/lib/timings.json ✓" : "save failed — use Download");
    } catch {
      setStatus("save failed — use Download");
    }
  };

  const download = () => {
    const blob = new Blob([JSON.stringify({ lines: times }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "timings.json";
    a.click();
  };

  const done = times.filter((t) => t !== null).length;

  return (
    <div className="sync" dir="ltr">
      <div className="sync-top">
        <video ref={video} src={song.video} controls playsInline className="sync-video" />
        <div className="sync-now" dir="rtl">
          <p className="sync-label">line {ptr + 1} / {flatLines.length} — press SPACE when it starts</p>
          <p className="sync-line">{flatLines[ptr]?.text ?? "✓ all lines timed"}</p>
          <p className="sync-next">{flatLines[ptr + 1]?.text ?? ""}</p>
          <button className="sync-tap" onClick={tap}>
            TAP (space)
          </button>
          <div className="sync-tools">
            <button onClick={undo}>undo (backspace)</button>
            <label>
              speed{" "}
              <select value={rate} onChange={(e) => setRate(+e.target.value)}>
                <option value={0.75}>0.75×</option>
                <option value={1}>1×</option>
              </select>
            </label>
            <button onClick={save}>save</button>
            <button onClick={download}>download json</button>
            <span>
              {done}/{flatLines.length} {status}
            </span>
          </div>
        </div>
      </div>
      <ol className="sync-list">
        {flatLines.map((l, i) => (
          <li key={i} className={i === ptr ? "is-ptr" : ""} onClick={() => jumpTo(i)}>
            <span className="t">{times[i] !== null ? times[i]!.toFixed(2) : "—"}</span>
            <span className="p">{l.part.en}</span>
            <span className="x" dir="rtl">
              {l.text}
            </span>
          </li>
        ))}
      </ol>
      <style>{`
        .sync{min-height:100vh;padding:24px;background:#0d0a07;color:#f1e6cf;font-family:var(--font-vt),monospace;font-size:18px}
        .sync-top{display:grid;grid-template-columns:minmax(0,520px) 1fr;gap:24px;align-items:start;position:sticky;top:0;background:#0d0a07;padding-bottom:12px;z-index:2}
        .sync-video{width:100%;background:#000}
        .sync-label{color:#b9a77f;margin:0}
        .sync-line{font-family:var(--font-lalezar);font-size:44px;margin:8px 0;color:#e8b64a}
        .sync-next{font-family:var(--font-lalezar);font-size:24px;margin:0 0 12px;opacity:.5}
        .sync-tap{font-size:28px;padding:10px 28px;background:#e8b64a;color:#1b1206;border:0}
        .sync-tools{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:12px}
        .sync-tools button,.sync-tools select{font:inherit;background:#222;color:#f1e6cf;border:1px solid #555;padding:2px 10px}
        .sync-list{list-style:none;padding:0;margin:16px 0 0}
        .sync-list li{display:grid;grid-template-columns:80px 200px 1fr;gap:12px;padding:4px 8px;cursor:pointer;border-bottom:1px solid #2a2118}
        .sync-list li.is-ptr{background:#2c2015;outline:1px solid #e8b64a}
        .sync-list .t{color:#7dff8a}.sync-list .p{color:#b9a77f}.sync-list .x{font-family:var(--font-markazi);font-size:20px}
        @media (max-width:800px){.sync-top{grid-template-columns:1fr;position:static}}
      `}</style>
    </div>
  );
}
