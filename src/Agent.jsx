import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

// 工具调用摘要：把参数压成一行，别在手机上刷屏
const brief = (name, input) => {
  const i = input || {};
  if (name === "bash") return i.command || "";
  if (i.path) return i.path.replace(/^.*[\\/](?=[^\\/]*$)/, "");
  return Object.keys(i).length ? JSON.stringify(i).slice(0, 60) : "";
};

// 工作台：跑在 VPS 上的编码 agent，能真的改代码和部署
export default function Agent({ api, colors: C, dark }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { fetch(api + "/agent/info").then(r => r.json()).then(setInfo).catch(() => {}); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput(""); setBusy(true);
    setMsgs(m => [...m, { role: "user", text }, { role: "assistant", text: "", tools: [] }]);

    const patch = (fn) => setMsgs(m => { const n = [...m]; n[n.length - 1] = fn({ ...n[n.length - 1] }); return n; });

    try {
      const res = await fetch(api + "/agent/stream", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text().catch(() => "请求失败"));

      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let e; try { e = JSON.parse(line.slice(6)); } catch { continue; }
          if (e.type === "text") patch(a => ({ ...a, text: a.text + e.text }));
          else if (e.type === "tool_use") patch(a => ({ ...a, tools: [...a.tools, { name: e.name, brief: brief(e.name, e.input), running: true }] }));
          else if (e.type === "tool_result") patch(a => {
            const t = [...a.tools]; const i = t.map(x => x.running).lastIndexOf(true);
            if (i >= 0) t[i] = { ...t[i], running: false, ok: e.ok, output: e.output };
            return { ...a, tools: t };
          });
          else if (e.type === "error") patch(a => ({ ...a, error: e.text }));
        }
      }
    } catch (err) {
      patch(a => ({ ...a, error: String(err.message || err) }));
    }
    setBusy(false);
  };

  const reset = async () => {
    if (busy || !confirm("清空当前对话？（服务器上的代码不受影响）")) return;
    await fetch(api + "/agent/reset", { method: "POST" }).catch(() => {});
    setMsgs([]);
  };

  const card = { background: C.cardBg, borderRadius: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.07), 0 4px 10px rgba(0,0,0,0.07)" };

  return (
    <>
      <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "0 16px 12px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "6px 4px 2px" }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: C.text, letterSpacing: "0.5px" }}>工作台</div>
            {msgs.length > 0 && <button className="flat ghost" onClick={reset} style={{ marginLeft: "auto", border: "none", background: "transparent", color: C.placeholder, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>清空</button>}
          </div>
          <div style={{ fontSize: 13, color: C.placeholder, padding: "0 4px 16px" }}>
            {info ? (info.ready ? `直接改代码并部署 · ${info.model}` : "⚠️ 还没配好 API 渠道") : "…"}
          </div>

          {msgs.length === 0 && <div style={{ ...card, padding: 20, fontSize: 13.5, color: C.textSecondary, lineHeight: 1.75 }}>
            我现在跑在你的 VPS 上，能真的读写 Plutocael 的代码、跑命令、部署。<br />
            直接说要改什么就行，比如「日记的字再大一点」。<br />
            <span style={{ color: C.placeholder }}>前端改完我 push，Vercel 自动部署；后端要重启的话我会先跟你说一声。</span>
          </div>}

          {msgs.map((m, i) => m.role === "user" ? (
            <div key={i} style={{ display: "flex", justifyContent: "flex-end", margin: "14px 0" }}>
              <div style={{ maxWidth: "85%", padding: "10px 14px", borderRadius: 16, background: C.userBubble || C.accentLight, color: C.text, fontSize: 15, lineHeight: 1.6, overflowWrap: "anywhere" }}>{m.text}</div>
            </div>
          ) : (
            <div key={i} style={{ margin: "14px 0" }}>
              {m.tools.map((t, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", marginBottom: 6, borderRadius: 10, background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)", fontSize: 12.5, color: C.textSecondary }}>
                  <span style={{ color: t.running ? C.placeholder : (t.ok === false ? "#C0392B" : "#3AAF6B"), display: "flex", flexShrink: 0 }}>
                    <Icon size={13}>{t.running ? <circle cx="12" cy="12" r="9" /> : t.ok === false ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <polyline points="20 6 9 17 4 12" />}</Icon>
                  </span>
                  <span style={{ fontWeight: 600, flexShrink: 0 }}>{t.name}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "ui-monospace, monospace", opacity: 0.8 }}>{t.brief}</span>
                </div>
              ))}
              {m.text && <div style={{ fontSize: 15, lineHeight: 1.75, color: C.text, whiteSpace: "pre-wrap", overflowWrap: "anywhere", padding: "0 2px" }}>{m.text}</div>}
              {m.error && <div style={{ marginTop: 8, padding: "9px 12px", borderRadius: 10, background: "rgba(192,57,43,0.10)", color: "#C0392B", fontSize: 12.5, overflowWrap: "anywhere" }}>{m.error}</div>}
            </div>
          ))}

          {busy && <div style={{ padding: "4px 2px", color: C.placeholder, fontSize: 13 }}><span className="dot-typing"><span /><span /><span /></span></div>}
          <div ref={endRef} />
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: "8px 16px calc(10px + env(safe-area-inset-bottom, 0px))", background: C.bg }}>
        <div style={{ maxWidth: 620, margin: "0 auto", display: "flex", alignItems: "flex-end", gap: 10 }}>
          <textarea
            value={input} onChange={e => setInput(e.target.value)} rows={1}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            placeholder={busy ? "干活中…" : "要改什么？"}
            style={{ flex: 1, minWidth: 0, maxHeight: 140, padding: "11px 15px", borderRadius: 20, border: `1px solid ${C.divider}`, background: C.input, color: C.text, fontSize: 15, fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.5, boxSizing: "border-box" }}
          />
          <button onClick={send} disabled={busy || !input.trim()}
            style={{ width: 40, height: 40, borderRadius: "50%", border: "none", flexShrink: 0, cursor: busy || !input.trim() ? "default" : "pointer", background: busy || !input.trim() ? C.divider : C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={19}><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></Icon>
          </button>
        </div>
      </div>
    </>
  );
}
