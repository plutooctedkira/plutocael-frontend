import { useEffect, useState } from "react";
import PullRefresh from "./PullRefresh";
import SwipeRow from "./SwipeRow";

const API = import.meta.env.VITE_API_BASE || "/api";
const Icon = ({ children, size = 16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>);

/**
 * MCP 服务器管理：卡片列表(名称+已连接/工具标签) → 点进底部编辑弹层
 * 左滑删除；启用的服务器工具聚合给 Cael
 */
export default function McpManager({ colors: C, dark }) {
  const [servers, setServers] = useState([]);
  const [tools, setTools] = useState([]);
  const [sheet, setSheet] = useState(null); // null | {id?, name, url, enabled}
  const [test, setTest] = useState(null); // {loading} | {ok, tools|error}

  const load = async () => {
    try {
      const [sv, tl] = await Promise.all([
        fetch(API + "/mcp/servers").then(r => r.json()).catch(() => ({ data: [] })),
        fetch(API + "/mcp/tools").then(r => r.json()).catch(() => ({ tools: [] })),
      ]);
      setServers(sv.data || []);
      setTools(tl.tools || []);
    } catch (e) {}
  };
  useEffect(() => { load(); }, []);

  const saveSheet = async () => {
    const f = sheet;
    if (!f || !f.name.trim() || !f.url.trim()) return;
    try {
      if (f.id) await fetch(API + "/mcp/servers/" + f.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, url: f.url, enabled: f.enabled ? 1 : 0 }) });
      else await fetch(API + "/mcp/servers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.name, url: f.url }) });
      setSheet(null); setTest(null); load();
    } catch (e) {}
  };
  const delServer = async (s) => {
    if (!confirm(`删除「${s.name}」？`)) return;
    try { await fetch(API + "/mcp/servers/" + s.id, { method: "DELETE" }); load(); } catch (e) {}
  };
  const runTest = async () => {
    if (!sheet) return;
    setTest({ loading: true });
    try {
      const r = sheet.id
        ? await fetch(API + "/mcp/servers/" + sheet.id + "/test", { method: "POST" }).then(x => x.json())
        : await fetch(API + "/mcp/servers/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: sheet.url }) }).then(x => x.json());
      setTest(r);
    } catch (e) { setTest({ ok: false, error: e.message }); }
  };

  const inputStyle = { width: "100%", boxSizing: "border-box", border: `1px solid ${C.divider}`, borderRadius: 12, padding: "11px 13px", fontSize: 14, outline: "none", background: C.input, color: C.text, fontFamily: "inherit" };
  const cardShadow = "0 1px 2px rgba(0,0,0,0.07), 0 4px 10px rgba(0,0,0,0.07)";

  return (
    <>
      <PullRefresh onRefresh={load} color={C.accent} className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "10px 16px calc(24px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: C.placeholder, padding: "0 4px 10px" }}>{servers.length} 个服务器 · 聚合 {tools.length} 个工具给 Cael 使用 · 左滑删除</div>

          {servers.length === 0 && <div style={{ background: C.cardBg, borderRadius: 16, padding: 20, textAlign: "center", fontSize: 13, color: C.placeholder, boxShadow: cardShadow }}>还没有 MCP 服务器，点下面添加一个</div>}

          {servers.map(s => {
            const serverTools = tools.filter(x => x.serverId === s.id);
            return <div key={s.id} style={{ marginBottom: 10 }}>
              <SwipeRow onDelete={() => delServer(s)} radius={16}>
                <button className="flat ghost" onClick={() => { setTest(null); setSheet({ id: s.id, name: s.name, url: s.url, enabled: !!s.enabled }); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "15px 15px", border: "none", background: C.cardBg, borderRadius: 16, cursor: "pointer", fontFamily: "inherit", textAlign: "left", boxShadow: cardShadow, boxSizing: "border-box" }}>
                  <span style={{ position: "relative", width: 46, height: 46, borderRadius: 13, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: C.text, flexShrink: 0 }}>
                    <Icon size={22}><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></Icon>
                    <span style={{ position: "absolute", right: -2, bottom: -2, width: 12, height: 12, borderRadius: "50%", background: s.enabled ? "#3AAF6B" : C.placeholder, border: `2px solid ${C.cardBg}` }} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15.5, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                    <span style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, padding: "2px 10px", borderRadius: 11, background: s.enabled ? "rgba(58,175,107,0.13)" : (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"), color: s.enabled ? "#2E8B57" : C.textSecondary, border: `1px solid ${s.enabled ? "rgba(58,175,107,0.35)" : C.divider}` }}>{s.enabled ? "已连接" : "已停用"}</span>
                      <span style={{ fontSize: 11.5, padding: "2px 10px", borderRadius: 11, background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", color: C.textSecondary, border: `1px solid ${C.divider}` }}>工具: {serverTools.length}/{serverTools.length}</span>
                    </span>
                  </span>
                  <span style={{ color: C.placeholder, display: "flex", flexShrink: 0 }}><Icon size={16}><polyline points="9 18 15 12 9 6" /></Icon></span>
                </button>
              </SwipeRow>
            </div>;
          })}

          <button className="ghost" onClick={() => { setTest(null); setSheet({ name: "", url: "", enabled: true }); }} style={{ width: "100%", padding: "12px", border: `1px dashed ${C.divider}`, borderRadius: 16, background: "transparent", color: C.accent, cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", marginTop: 4 }}>+ 添加 MCP</button>
          <div style={{ fontSize: 12, color: C.placeholder, padding: "12px 4px 0", lineHeight: 1.7 }}>💡 地址填完整的 MCP 端点（Streamable HTTP），鉴权直接拼在 URL 里，例如 https://xxx.com/mcp?api_key=你的key</div>
        </div>
      </PullRefresh>

      {sheet && <div onClick={() => setSheet(null)} style={{ position: "fixed", inset: 0, zIndex: 620, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: C.cardBg, borderRadius: "20px 20px 0 0", maxHeight: "86vh", display: "flex", flexDirection: "column", padding: "6px 0 calc(18px + env(safe-area-inset-bottom, 0px))", animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: C.divider, margin: "8px auto 4px", flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", padding: "4px 16px 10px", flexShrink: 0 }}>
            <button className="flat ghost" onClick={() => setSheet(null)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "transparent", color: C.textSecondary, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
            <span style={{ flex: 1, textAlign: "center", fontSize: 15.5, fontWeight: 600, color: C.text }}>{sheet.id ? "编辑 MCP" : "添加 MCP"}</span>
            <span style={{ width: 32 }} />
          </div>
          <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "2px 18px 6px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", borderRadius: 14, padding: "13px 15px", marginBottom: 14 }}>
              <span style={{ fontSize: 14.5, color: C.text }}>是否启用</span>
              <button className="flat ghost" onClick={() => setSheet({ ...sheet, enabled: !sheet.enabled })} style={{ width: 46, height: 28, borderRadius: 14, border: "none", background: sheet.enabled ? C.accent : C.divider, position: "relative", cursor: "pointer", transition: "background 0.2s", padding: 0, flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 3, left: sheet.enabled ? 21 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </button>
            </div>
            <div style={{ fontSize: 12.5, color: C.textSecondary, padding: "0 2px 6px" }}>名称</div>
            <input value={sheet.name} onChange={e => setSheet({ ...sheet, name: e.target.value })} placeholder="My MCP" style={{ ...inputStyle, marginBottom: 14 }} />
            <div style={{ fontSize: 12.5, color: C.textSecondary, padding: "0 2px 6px" }}>服务器地址</div>
            <textarea value={sheet.url} onChange={e => setSheet({ ...sheet, url: e.target.value })} rows={2} placeholder="https://xxx.com/mcp?api_key=..." style={{ ...inputStyle, resize: "none", lineHeight: 1.5, marginBottom: 12 }} />
            {test && !test.loading && (test.ok
              ? <div style={{ fontSize: 12.5, color: "#2E8B57", background: "rgba(58,175,107,0.12)", borderRadius: 10, padding: "9px 12px", marginBottom: 10 }}>✓ 连接成功，{(test.tools || []).length} 个工具{test.tools && test.tools.length ? "：" + test.tools.slice(0, 6).join("、") + (test.tools.length > 6 ? "…" : "") : ""}</div>
              : <div style={{ fontSize: 12.5, color: "#C0392B", background: "rgba(192,57,43,0.10)", borderRadius: 10, padding: "9px 12px", marginBottom: 10, overflowWrap: "anywhere" }}>✗ 连接失败：{test.error}</div>)}
          </div>
          <div style={{ display: "flex", gap: 10, padding: "10px 18px 0", flexShrink: 0 }}>
            <button className="ghost" onClick={runTest} style={{ padding: "12px 18px", border: `1px solid ${C.divider}`, borderRadius: 14, background: "transparent", color: C.text, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>{test && test.loading ? "测试中…" : "测试连接"}</button>
            <button className="ghost" onClick={saveSheet} style={{ flex: 1, padding: "12px", border: "none", borderRadius: 14, background: C.accent, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>✓ 保存</button>
          </div>
        </div>
      </div>}
    </>
  );
}
