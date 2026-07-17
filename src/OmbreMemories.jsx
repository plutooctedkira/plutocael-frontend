import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 记忆页：展示 Ombre Brain(OB) 的记忆桶
 * 数据走后端代理 /api/ombre-dashboard/*，前端不接触密码
 */
const FILTERS = [
  { key: "all", label: "全部" },
  { key: "dynamic", label: "动态", type: "dynamic" },
  { key: "permanent", label: "永久", type: "permanent" },
  { key: "archived", label: "归档", type: "archived" },
  { key: "pinned", label: "钉选", state: "pinned" },
];

const fmtTime = (v, full) => {
  if (!v) return full ? "—" : "";
  const d = new Date(typeof v === "string" ? v.replace(" ", "T") : v);
  if (Number.isNaN(d.getTime())) return full ? "—" : "";
  return d.toLocaleString("zh-CN", full
    ? { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }
    : { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
};

const impDots = (v) => {
  const n = Math.max(0, Math.min(10, Math.round(Number(v ?? 5))));
  return "●".repeat(n) + "○".repeat(10 - n);
};

export default function OmbreMemories({ api, colors: C, dark }) {
  const [status, setStatus] = useState(null);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [sheetH, setSheetH] = useState(420);
  const sheetDrag = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const f = FILTERS.find(x => x.key === filter) || FILTERS[0];
      const statusPromise = fetch(`${api}/ombre-dashboard/status`).then(r => r.ok ? r.json() : { available: false }).catch(() => ({ available: false }));
      const params = new URLSearchParams();
      if (f.type) params.set("type", f.type);
      if (f.state) params.set("state", f.state);
      const path = debounced
        ? `/ombre-dashboard/search?q=${encodeURIComponent(debounced)}`
        : `/ombre-dashboard/buckets?${params.toString()}`;
      const [st, resp] = await Promise.all([statusPromise, fetch(`${api}${path}`)]);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setStatus(st);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setStatus({ available: false });
      setError(true);
    } finally { setLoading(false); }
  }, [api, filter, debounced]);

  useEffect(() => { load(); }, [load]);

  // 点卡片先用已有数据立即开面板，再去拿完整内容补上
  const openDetail = async (item) => {
    setSheetH(Math.round(window.innerHeight * 0.58));
    setSelected(item); setDetailLoading(true); setCopiedId(false);
    try {
      const r = await fetch(`${api}/ombre-dashboard/buckets/${encodeURIComponent(item.id)}`);
      if (!r.ok) throw new Error();
      setSelected(await r.json());
    } catch (e) { /* 拿不到就用列表里的 */ } finally { setDetailLoading(false); }
  };

  const [patching, setPatching] = useState(false);
  // 管理：钉选/已解决 开关，PATCH 后同步详情和列表
  const patchMemory = async (fields) => {
    if (!selected || patching) return;
    setPatching(true);
    try {
      const r = await fetch(`${api}/ombre-dashboard/buckets/${encodeURIComponent(selected.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields),
      });
      if (r.ok) {
        const d = await r.json().catch(() => null);
        setSelected(prev => ({ ...prev, ...fields, ...(d && d.id ? d : {}) }));
        load();
      }
    } catch (e) { /* 网络失败保持原状 */ } finally { setPatching(false); }
  };

  const online = status && status.available;
  const chip = (active) => ({
    padding: "5px 14px", borderRadius: 16, border: active ? "none" : `1px solid ${C.divider}`,
    background: active ? C.accent : "transparent", color: active ? "#fff" : C.textSecondary,
    fontSize: 12, cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
  });
  const infoRow = { display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.divider}`, fontSize: 13 };

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ width: "100%", maxWidth: 620, margin: "0 auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "6px 16px 0", boxSizing: "border-box" }}>

        {/* 状态栏 */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "2px 4px 10px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: online ? "#3AAF6B" : C.placeholder, display: "inline-block" }} />
          <span style={{ fontSize: 13, color: C.textSecondary }}>
            Ombre · {online ? `${status.total ?? items.length} 条记忆` : "离线"}
          </span>
          <span style={{ flex: 1 }} />
          <button className="flat ghost" onClick={load} style={{ border: "none", background: "transparent", color: C.textSecondary, fontSize: 12, cursor: "pointer", padding: "4px 6px", fontFamily: "inherit" }}>刷新</button>
        </div>

        {/* 搜索框 */}
        <input
          value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索记忆…"
          style={{ width: "100%", boxSizing: "border-box", border: "none", outline: "none", borderRadius: 18, padding: "9px 16px", fontSize: 14, fontFamily: "inherit", color: C.text, background: dark ? "rgba(48,48,46,0.85)" : "rgba(255,255,255,0.8)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.10)", marginBottom: 10 }}
        />

        {/* 筛选 */}
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 10, flexShrink: 0 }}>
          {FILTERS.map(f => <button key={f.key} className="flat ghost" onClick={() => setFilter(f.key)} style={chip(filter === f.key)}>{f.label}</button>)}
        </div>

        {/* 列表 */}
        <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", fontSize: 13, color: C.placeholder }}>加载中…</div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "40px 0", fontSize: 13, color: C.textSecondary, lineHeight: 2 }}>
              <div>Ombre 在睡觉。</div>
              <div style={{ color: C.placeholder }}>记忆都还安全地存着。</div>
              <button className="ghost" onClick={load} style={{ marginTop: 12, padding: "7px 22px", borderRadius: 16, border: "none", background: C.accent, color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>重试</button>
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", fontSize: 13, color: C.placeholder }}>{debounced ? "没有找到相关记忆" : "还没有记忆"}</div>
          ) : items.map(m => (
            <button key={m.id} className="flat ghost" onClick={() => openDetail(m)} style={{ display: "block", width: "100%", textAlign: "left", border: "none", cursor: "pointer", fontFamily: "inherit", background: C.cardBg, borderRadius: 14, padding: "11px 14px", marginBottom: 9, boxShadow: "0 1px 2px rgba(0,0,0,0.07), 0 4px 10px rgba(0,0,0,0.07)", color: C.text, boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: C.accent, background: C.accentLight, padding: "1px 8px", borderRadius: 8 }}>{m.type}</span>
                {m.pinned && <span style={{ fontSize: 11, color: C.textSecondary }}>📌</span>}
                {m.resolved && <span style={{ fontSize: 11, color: C.placeholder }}>已解决</span>}
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: C.placeholder }}>{fmtTime(m.lastActiveAt || m.createdAt)}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name || "(无标题)"}</div>
              <div style={{ fontSize: 12.5, color: C.textSecondary, lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 6 }}>{m.contentPreview || "(空)"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, letterSpacing: 1, color: C.accent, opacity: 0.85 }}>{impDots(m.importance)}</span>
                <span style={{ flex: 1 }} />
                {[...(m.domains || []), ...(m.tags || [])].slice(0, 3).map((t, i) => (
                  <span key={i} style={{ fontSize: 10.5, color: C.textSecondary, background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", padding: "1px 7px", borderRadius: 7 }}>{t}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 详情：底部上弹卡片，可拖高 */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.35)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: dark ? "rgba(40,40,38,0.85)" : "rgba(255,255,255,0.82)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", borderRadius: "22px 22px 0 0", height: sheetH, margin: "0 4px", display: "flex", flexDirection: "column", animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)", boxShadow: "0 -8px 32px rgba(0,0,0,0.20)" }}>
            <div style={{ flexShrink: 0, touchAction: "none", cursor: "grab" }}
              onPointerDown={e => { sheetDrag.current = { y: e.clientY, h: sheetH }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {} }}
              onPointerMove={e => { if (!sheetDrag.current) return; setSheetH(Math.min(window.innerHeight - 20, Math.max(200, sheetDrag.current.h + (sheetDrag.current.y - e.clientY)))); }}
              onPointerUp={() => { sheetDrag.current = null; }} onPointerCancel={() => { sheetDrag.current = null; }}>
              <div style={{ width: 40, height: 5, borderRadius: 3, background: C.divider, margin: "10px auto 0" }} />
              <div style={{ display: "flex", alignItems: "center", padding: "10px 20px 6px" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.name || "(无标题)"}</div>
                <span style={{ flex: 1 }} />
                <button className="flat ghost" onClick={() => setSelected(null)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.07)", color: C.textSecondary, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>✕</button>
              </div>
            </div>
            <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "2px 22px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>
                {[selected.type, selected.pinned && "📌 钉选", selected.resolved && "已解决"].filter(Boolean).join(" · ")}
              </div>
              {detailLoading && <div style={{ fontSize: 12, color: C.placeholder, marginBottom: 8 }}>正在展开完整记忆…</div>}
              <div style={{ fontSize: 14, lineHeight: 1.75, color: C.text, whiteSpace: "pre-wrap", overflowWrap: "anywhere", marginBottom: 16 }}>{selected.content || selected.contentPreview || "(空)"}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button className="flat ghost" disabled={patching} onClick={() => patchMemory({ pinned: !selected.pinned })} style={{ flex: 1, padding: "9px 0", borderRadius: 14, border: selected.pinned ? "none" : `1px solid ${C.divider}`, background: selected.pinned ? C.accent : "transparent", color: selected.pinned ? "#fff" : C.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: patching ? 0.5 : 1 }}>{selected.pinned ? "📌 已钉选 · 点击取消" : "📌 钉选"}</button>
                <button className="flat ghost" disabled={patching} onClick={() => patchMemory({ resolved: !selected.resolved })} style={{ flex: 1, padding: "9px 0", borderRadius: 14, border: selected.resolved ? "none" : `1px solid ${C.divider}`, background: selected.resolved ? "#3AAF6B" : "transparent", color: selected.resolved ? "#fff" : C.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: patching ? 0.5 : 1 }}>{selected.resolved ? "✓ 已解决 · 点击恢复" : "✓ 标记已解决"}</button>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ ...infoRow }}><span style={{ color: C.textSecondary }}>被想起</span><span>{selected.activationCount || 0} 次</span></div>
                <div style={{ ...infoRow }}><span style={{ color: C.textSecondary }}>创建于</span><span>{fmtTime(selected.createdAt, true)}</span></div>
                <div style={{ ...infoRow }}><span style={{ color: C.textSecondary }}>最近激活</span><span>{fmtTime(selected.lastActiveAt, true)}</span></div>
                <div style={{ ...infoRow }}><span style={{ color: C.textSecondary }}>重要度</span><span style={{ color: C.accent, letterSpacing: 1, fontSize: 11 }}>{impDots(selected.importance)}</span></div>
                {selected.valence !== null && selected.valence !== undefined && <div style={{ ...infoRow }}><span style={{ color: C.textSecondary }}>valence</span><span>{selected.valence}</span></div>}
                {selected.arousal !== null && selected.arousal !== undefined && <div style={{ ...infoRow, borderBottom: "none" }}><span style={{ color: C.textSecondary }}>arousal</span><span>{selected.arousal}</span></div>}
              </div>
              {([...(selected.domains || []), ...(selected.tags || [])].length > 0) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {[...(selected.domains || []), ...(selected.tags || [])].map((t, i) => (
                    <span key={i} style={{ fontSize: 11, color: C.textSecondary, background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", padding: "2px 9px", borderRadius: 8 }}>{t}</span>
                  ))}
                </div>
              )}
              <button className="flat ghost" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(selected.id || ""); setCopiedId(true); setTimeout(() => setCopiedId(false), 1200); }} style={{ border: "none", background: "transparent", color: copiedId ? "#3AAF6B" : C.placeholder, fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit", overflowWrap: "anywhere", textAlign: "left" }}>
                {copiedId ? "已复制 ID" : `ID: ${selected.id} · 点击复制`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
