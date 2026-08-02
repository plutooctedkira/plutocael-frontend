import { useEffect, useRef, useState } from "react";
import { getToken, login, authRequired, onAuthExpired } from "./auth";
import { THEMES, DEFAULT_CUSTOM, buildCustomColors } from "./themes";

// 口令页在 App 挂载之前就显示，读不到组件里的主题状态，所以直接从 localStorage 取
function currentColors() {
  try {
    const t = localStorage.getItem("pluto_theme") || "claude";
    if (t === "custom") {
      const c = { ...DEFAULT_CUSTOM, ...(JSON.parse(localStorage.getItem("pluto_custom_theme")) || {}) };
      return buildCustomColors(c);
    }
    return THEMES[t] || THEMES.claude;
  } catch (e) { return THEMES.claude; }
}

// 口令门：没通过就不渲染 children（App 不挂载 = 不会有请求先跑出去挨 401）
export default function AuthGate({ children }) {
  const [state, setState] = useState("checking"); // checking | need | ok
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!(await authRequired())) return setState("ok"); // 后端没开口令
      setState(getToken() ? "ok" : "need");
    })();
    // 任何请求 401（口令改了/存的是旧的）→ 退回输入框
    return onAuthExpired(() => { setErr("口令已失效，请重新输入"); setState("need"); });
  }, []);

  useEffect(() => { if (state === "need") inputRef.current?.focus(); }, [state]);

  const submit = async (e) => {
    e.preventDefault();
    if (!pwd.trim() || busy) return;
    setBusy(true); setErr("");
    const ok = await login(pwd.trim());
    setBusy(false);
    if (ok) { setPwd(""); setState("ok"); } else { setErr("口令不对，再试一次"); setPwd(""); }
  };

  const C = currentColors();
  const wrap = {
    position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
    background: C._solidBg || C.bg, padding: "0 20px", paddingBottom: "18vh", boxSizing: "border-box",
  };

  if (state === "ok") return children;
  if (state === "checking") return <div style={wrap} />;

  const idle = busy || !pwd.trim();
  return (
    <div style={wrap}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: "min(88vw, 320px)" }}>
        <div style={{ fontFamily: "'Snell Roundhand', 'Brush Script MT', cursive", fontStyle: "italic", fontSize: 40, color: C.text, letterSpacing: "0.5px" }}>Plutocael</div>
        <input
          ref={inputRef} type="password" value={pwd} onChange={e => setPwd(e.target.value)}
          placeholder="访问口令" autoComplete="current-password"
          style={{ width: "100%", boxSizing: "border-box", padding: "13px 16px", fontSize: 16, textAlign: "center", borderRadius: 14, border: `1px solid ${C.inputBorder}`, background: C.input, color: C.text, outline: "none", fontFamily: "inherit" }}
        />
        {err && <div style={{ fontSize: 13, color: C.danger }}>{err}</div>}
        <button type="submit" disabled={idle}
          style={{ width: "100%", padding: "13px", fontSize: 15, borderRadius: 14, border: "none", background: idle ? C.divider : C.accent, color: "#fff", cursor: idle ? "default" : "pointer", fontFamily: "inherit" }}>
          {busy ? "验证中…" : "进入"}
        </button>
      </form>
    </div>
  );
}
