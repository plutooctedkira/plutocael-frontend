import { useEffect, useRef, useState } from "react";
import { getToken, login, authRequired, onAuthExpired } from "./auth";

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

  if (state === "ok") return children;
  if (state === "checking") return <div style={{ ...wrap, background: "#F5F4EE" }} />;

  return (
    <div style={wrap}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: "min(88vw, 320px)" }}>
        <div style={{ fontFamily: "'Snell Roundhand', 'Brush Script MT', cursive", fontStyle: "italic", fontSize: 40, color: "#1F1E1D", letterSpacing: "0.5px" }}>Plutocael</div>
        <input
          ref={inputRef} type="password" value={pwd} onChange={e => setPwd(e.target.value)}
          placeholder="访问口令" autoComplete="current-password"
          style={{ width: "100%", boxSizing: "border-box", padding: "13px 16px", fontSize: 16, textAlign: "center", borderRadius: 14, border: "1px solid #E5E1D8", background: "#FFFDF7", color: "#1F1E1D", outline: "none", fontFamily: "inherit" }}
        />
        {err && <div style={{ fontSize: 13, color: "#C0392B" }}>{err}</div>}
        <button type="submit" disabled={busy || !pwd.trim()}
          style={{ width: "100%", padding: "13px", fontSize: 15, borderRadius: 14, border: "none", background: busy || !pwd.trim() ? "#CFC9BC" : "#D97757", color: "#fff", cursor: busy || !pwd.trim() ? "default" : "pointer", fontFamily: "inherit" }}>
          {busy ? "验证中…" : "进入"}
        </button>
      </form>
    </div>
  );
}

const wrap = {
  position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
  background: "#F5F4EE", padding: "0 20px", paddingBottom: "18vh", boxSizing: "border-box",
};
