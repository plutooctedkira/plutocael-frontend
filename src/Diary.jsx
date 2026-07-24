import { useEffect, useState } from "react";
import PullRefresh from "./PullRefresh";

const Icon = ({ children, size = 16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>);
// 2026-07-24 → 2026-7-24
const fmtDate = (d) => { if (!d) return ""; const p = String(d).split("-"); return p.length === 3 ? `${p[0]}-${Number(p[1])}-${Number(p[2])}` : d; };
const firstLine = (c) => String(c || "").split("\n").map(s => s.trim()).find(Boolean) || "无更多文本";

// 日记：Apple 备忘录风格，每条标题+日期+首行预览，点开整篇
export default function Diary({ api, colors: C, dark }) {
  const [entries, setEntries] = useState(null);
  const [open, setOpen] = useState(null); // 打开的整篇

  const load = async () => {
    try { const r = await fetch(api + "/diary").then(x => x.json()); setEntries(r.entries || []); } catch (e) { setEntries([]); }
  };
  useEffect(() => { load(); }, []);

  return (
    <>
      <PullRefresh onRefresh={load} color={C.accent} className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "0 16px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.text, padding: "6px 4px 2px", letterSpacing: "0.5px" }}>日记</div>
          <div style={{ fontSize: 13, color: C.placeholder, padding: "0 4px 16px" }}>{entries === null ? "加载中…" : `${entries.length} 篇日记`}</div>

          {entries !== null && entries.length === 0 && <div style={{ background: C.cardBg, borderRadius: 16, padding: 22, textAlign: "center", fontSize: 13, color: C.placeholder, boxShadow: "0 1px 2px rgba(0,0,0,0.07), 0 4px 10px rgba(0,0,0,0.07)" }}>还没有日记。Cael 用 OB 的 letter_write 写的信件会出现在这里。</div>}

          {entries !== null && entries.length > 0 && <div style={{ background: C.cardBg, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.07), 0 4px 10px rgba(0,0,0,0.07)" }}>
            {entries.map((e, i) => (
              <button key={e.id || i} className="flat ghost" onClick={() => setOpen(e)} style={{ width: "100%", display: "block", textAlign: "left", border: "none", borderTop: i > 0 ? `1px solid ${C.divider}` : "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", padding: "14px 16px" }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title || "无标题"}</div>
                <div style={{ fontSize: 13.5, color: C.placeholder, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ color: C.textSecondary }}>{fmtDate(e.date)}</span>　{firstLine(e.content)}
                </div>
              </button>
            ))}
          </div>}
        </div>
      </PullRefresh>

      {open && <div style={{ position: "fixed", inset: 0, zIndex: 560, display: "flex", flexDirection: "column", backgroundColor: C.bg, paddingTop: "calc(10px + env(safe-area-inset-top, 0px))", animation: "slideRightIn 0.27s cubic-bezier(0.32, 0.72, 0, 1)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "2px 12px 6px", flexShrink: 0 }}>
          <button className="flat ghost" onClick={() => setOpen(null)} style={{ display: "flex", alignItems: "center", gap: 3, border: "none", background: "transparent", color: C.accent, cursor: "pointer", fontSize: 15, fontFamily: "inherit", padding: "6px 8px" }}><Icon size={20}><polyline points="15 18 9 12 15 6" /></Icon>日记</button>
          <span style={{ flex: 1 }} />
        </div>
        <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "4px 22px calc(30px + env(safe-area-inset-bottom, 0px))" }}>
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{open.title || "无标题"}</div>
            <div style={{ fontSize: 12.5, color: C.placeholder, marginTop: 8, marginBottom: 18 }}>{fmtDate(open.date)}　{open.author}</div>
            <div style={{ fontSize: 15.5, lineHeight: 1.85, color: C.text, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{open.content || "（空）"}</div>
          </div>
        </div>
      </div>}
    </>
  );
}
