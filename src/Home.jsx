import { useEffect, useState } from "react";
import PullRefresh from "./PullRefresh";
import Icon from "./Icon";

// 2026-07-24 → 2026-7-24
const fmtDate = (d) => { if (!d) return ""; const p = String(d).split("-"); return p.length === 3 ? `${p[0]}-${Number(p[1])}-${Number(p[2])}` : d; };
const firstLine = (c) => String(c || "").split("\n").map(s => s.trim()).find(Boolean) || "无更多文本";
// 8月15日 星期六（zh-CN 的 long 格式会挤成"8月15日星期六"，自己拼一下）
const today = () => { const t = new Date(); return `${t.getMonth() + 1}月${t.getDate()}日 星期${"日一二三四五六"[t.getDay()]}`; };
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmtK = (n) => n >= 1000 ? `${Math.round(n / 100) / 10}K`.replace(".0K", "K") : String(n);

// 占位图标：折角信纸的像素画。等有素材了把这里换成 <img src=…> 就行
const FileIcon = () => (
  <svg width="46" height="52" viewBox="0 0 23 26" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M1 1h14l6 6v18H1z" fill="#FDFBF0" stroke="#000" strokeWidth="1" />
    <path d="M15 1v6h6" fill="#DCD8C4" stroke="#000" strokeWidth="1" />
    {[11, 14, 17, 20].map(y => <rect key={y} x="4" y={y} width="15" height="1" fill="#7A7668" />)}
    <rect x="4" y="9" width="9" height="1" fill="#7A7668" />
  </svg>
);

// 首页：日历 / Todo / Done List / 日记 / 用量图表
export default function Home({ api, colors: C, dark, readerRef }) {
  const [entries, setEntries] = useState(null);   // 日记
  const [todos, setTodos] = useState(null);       // 待办（done 决定落哪个板块）
  const [daily, setDaily] = useState(null);       // 每天的 token 用量
  const [month, setMonth] = useState(() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1); });
  const [adding, setAdding] = useState("");
  const [open, setOpen] = useState(null);         // 打开的整篇日记
  const [panel, setPanel] = useState(null);       // 点开的图标：todo / done / diary
  const closeReader = () => setOpen(null);
  // 返回手势的层级：整篇日记 → 图标面板 → 首页，一层层退
  if (readerRef) readerRef.current = {
    isOpen: () => !!open || !!panel,
    close: () => { if (open) return closeReader(); setPanel(null); },
  };

  // 三份数据各拉各的：后端还没部署新接口时，各自退成空态，不影响别的板块
  const load = async () => {
    const get = (path, pick, set) => fetch(api + path).then(r => r.ok ? r.json() : Promise.reject()).then(j => set(pick(j))).catch(() => set([]));
    await Promise.all([
      get("/diary", j => j.entries || [], setEntries),
      get("/todos", j => j.items || [], setTodos),
      get("/gateway/daily?days=30", j => j.days || [], setDaily),
    ]);
  };
  useEffect(() => { load(); }, []);

  const card = { background: C.cardBg, borderRadius: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.07), 0 4px 10px rgba(0,0,0,0.07)" };
  // 板块小标题：左边名字，右边一句灰字（条数之类）
  const secHead = (title, right) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "22px 4px 9px" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "0.3px" }}>{title}</div>
      {right && <div style={{ marginLeft: "auto", fontSize: 13.5, color: C.placeholder }}>{right}</div>}
    </div>
  );
  const empty = (icon, line, sub) => (
    <div style={{ ...card, padding: "26px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
      <span style={{ color: C.placeholder, opacity: 0.65, display: "flex" }}><Icon size={26}>{icon}</Icon></span>
      <div style={{ fontSize: 14.5, color: C.textSecondary }}>{line}</div>
      {sub && <div style={{ fontSize: 13, color: C.placeholder, textAlign: "center", lineHeight: 1.6 }}>{sub}</div>}
    </div>
  );

  // ── 日历：当月网格，今天描一圈，有日记/完成过待办的日子点一颗点 ──
  const calendar = (() => {
    const y = month.getFullYear(), m = month.getMonth();
    const first = new Date(y, m, 1).getDay();       // 当月1号是周几
    const days = new Date(y, m + 1, 0).getDate();   // 当月天数
    const todayStr = ymd(new Date());
    const marked = new Set([
      ...(entries || []).map(e => e.date),
      ...(todos || []).filter(t => t.done && t.done_at).map(t => String(t.done_at).slice(0, 10)),
    ]);
    const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
    const navBtn = (dir, icon) => (
      <button className="flat ghost" onClick={() => setMonth(new Date(y, m + dir, 1))}
        style={{ width: 30, height: 30, border: "none", background: "transparent", color: C.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
        <Icon size={17}>{icon}</Icon>
      </button>
    );
    return (
      <div style={{ ...card, padding: "12px 12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 2px 8px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{y}年{m + 1}月</div>
          <span style={{ flex: 1 }} />
          {navBtn(-1, <polyline points="15 18 9 12 15 6" />)}
          {navBtn(1, <polyline points="9 18 15 12 9 6" />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {"日一二三四五六".split("").map(w => (
            <div key={w} style={{ textAlign: "center", fontSize: 12, color: C.placeholder, padding: "2px 0 4px" }}>{w}</div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={`b${i}`} />;
            const str = ymd(new Date(y, m, d));
            const isToday = str === todayStr;
            return (
              <div key={d} style={{ height: 34, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                <span style={{ width: 26, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, borderRadius: 11, background: isToday ? C.accent : "transparent", color: isToday ? "#fff" : C.text, fontWeight: isToday ? 600 : 400 }}>{d}</span>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: marked.has(str) ? C.accent : "transparent" }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  })();

  // 待办的三个动作：先改本地再发请求，点起来不等网络；失败了就把列表拉回真实状态
  const addTodo = async () => {
    const content = adding.trim();
    if (!content) return;
    setAdding("");
    try {
      const r = await fetch(api + "/todos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      if (!r.ok) throw new Error();
      const t = await r.json();
      setTodos(prev => [t, ...(prev || [])]);
    } catch (e) { setAdding(content); }
  };
  const toggleTodo = async (t) => {
    const next = !t.done;
    setTodos(prev => (prev || []).map(x => x.id === t.id ? { ...x, done: next, done_at: next ? new Date().toISOString().slice(0, 19).replace("T", " ") : null } : x));
    try {
      const r = await fetch(api + "/todos/" + t.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: next }) });
      if (!r.ok) throw new Error();
    } catch (e) { load(); }
  };
  const removeTodo = async (t) => {
    setTodos(prev => (prev || []).filter(x => x.id !== t.id));
    try {
      const r = await fetch(api + "/todos/" + t.id, { method: "DELETE" });
      if (!r.ok) throw new Error();
    } catch (e) { load(); }
  };

  const undone = (todos || []).filter(t => !t.done);
  const done = (todos || []).filter(t => t.done);

  // ── 用量图表：每天一根堆叠柱，从下往上 输出/未命中缓存/命中缓存 ──
  const chart = (() => {
    const SERIES = [
      { key: "output", label: "输出", op: 1 },
      { key: "cache_miss", label: "未命中缓存", op: 0.55 },
      { key: "cache_hit", label: "命中缓存", op: 0.26 },
    ];
    const H = 150;
    // 补齐最近 30 天，没数据的日子留空档（跟截图一样是断续的柱子）
    const map = new Map((daily || []).map(d => [d.day, d]));
    const span = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      const s = ymd(d);
      return map.get(s) || { day: s, output: 0, cache_miss: 0, cache_hit: 0 };
    });
    const totalOf = (d) => d.output + d.cache_miss + d.cache_hit;
    const peak = Math.max(1, ...span.map(totalOf));
    // 纵轴刻度取个整数（1/2/5 × 10^n）
    const mag = Math.pow(10, Math.floor(Math.log10(peak)));
    const top = [1, 2, 5, 10].map(x => x * mag).find(x => x >= peak) || peak;
    const sum = span.reduce((a, d) => a + totalOf(d), 0);
    const gridLine = (v, bottom) => (
      <div key={v} style={{ position: "absolute", left: 0, right: 0, bottom, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: C.placeholder, width: 30, textAlign: "right", flexShrink: 0 }}>{fmtK(v)}</span>
        <span style={{ flex: 1, height: 1, background: C.divider }} />
      </div>
    );
    return (
      <div style={{ ...card, padding: "14px 14px 10px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Tokens</span>
          <span style={{ fontSize: 16, color: C.textSecondary }}>{sum.toLocaleString()}</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: C.placeholder }}>近 30 天</span>
        </div>
        {daily === null ? <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: C.placeholder }}>加载中…</div>
          : sum === 0 ? <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: C.placeholder }}>这段时间还没有用量记录</div>
          : <>
            <div style={{ position: "relative", height: H }}>
              {gridLine(top, H - 1)}{gridLine(top / 2, H / 2 - 1)}{gridLine(0, 0)}
              <div style={{ position: "absolute", left: 38, right: 0, bottom: 0, height: H, display: "flex", alignItems: "flex-end", gap: 2 }}>
                {span.map(d => (
                  <div key={d.day} title={`${fmtDate(d.day)}　${totalOf(d).toLocaleString()}`} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                    {[...SERIES].reverse().map(s => (
                      <div key={s.key} style={{ height: `${(d[s.key] / top) * 100}%`, background: C.accent, opacity: s.op }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", marginLeft: 38, marginTop: 6 }}>
              {[0, 10, 20, 29].map((i, k) => (
                <span key={i} style={{ flex: k === 3 ? "0 0 auto" : 1, fontSize: 11, color: C.placeholder }}>{Number(span[i].day.slice(5, 7))}/{Number(span[i].day.slice(8, 10))}</span>
              ))}
            </div>
          </>}
        <div style={{ display: "flex", gap: 14, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.divider}`, flexWrap: "wrap" }}>
          {SERIES.map(s => (
            <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: C.textSecondary }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: C.accent, opacity: s.op, flexShrink: 0 }} />{s.label}
            </span>
          ))}
        </div>
      </div>
    );
  })();

  // ── 待办行：圆圈打勾 + 右边删除 ──
  const todoRow = (t, i, arr) => (
    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderTop: i > 0 ? `1px solid ${C.divider}` : "none" }}>
      <button className="flat" onClick={() => toggleTodo(t)} title={t.done ? "取消完成" : "标记完成"}
        style={{ width: 21, height: 21, borderRadius: "50%", flexShrink: 0, padding: 0, cursor: "pointer", border: t.done ? "none" : `1.5px solid ${C.divider}`, background: t.done ? C.accent : "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {t.done && <Icon size={12}><polyline points="20 6 9 17 4 12" /></Icon>}
      </button>
      <span style={{ flex: 1, minWidth: 0, fontSize: 15.5, lineHeight: 1.5, color: t.done ? C.placeholder : C.text, textDecoration: t.done ? "line-through" : "none", overflowWrap: "anywhere" }}>{t.content}</span>
      <button className="flat ghost" onClick={() => removeTodo(t)} title="删除"
        style={{ border: "none", background: "transparent", color: C.placeholder, cursor: "pointer", fontSize: 15, padding: "2px 4px", flexShrink: 0, lineHeight: 1 }}>✕</button>
    </div>
  );

  return (
    <>
      <PullRefresh onRefresh={load} color={C.accent} className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "0 16px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={{ fontSize: 32, lineHeight: 1.25, fontWeight: 800, color: C.text, padding: "6px 4px 2px", letterSpacing: "0.5px" }}>首页</div>
          <div style={{ fontSize: 14, color: C.placeholder, padding: "0 4px 14px" }}>{today()}</div>

          {calendar}

          {/* 三个桌面图标：点开各自的面板 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, padding: "20px 0 4px" }}>
            {[
              { key: "todo", label: "Todo", n: undone.length },
              { key: "done", label: "Done List", n: done.length },
              { key: "diary", label: "日记", n: (entries || []).length },
            ].map(it => (
              <button key={it.key} className="flat" onClick={() => setPanel(it.key)}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", padding: "6px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <span style={{ position: "relative", display: "flex" }}>
                  <FileIcon />
                  {it.n > 0 && <span style={{ position: "absolute", top: -4, right: -6, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 9, background: C.accent, color: "#fff", fontSize: 11, lineHeight: "17px", textAlign: "center", boxSizing: "border-box" }}>{it.n}</span>}
                </span>
                <span style={{ fontSize: 13, color: C.text, textAlign: "center", lineHeight: 1.3 }}>{it.label}</span>
              </button>
            ))}
          </div>

          {/* 用量图表 */}
          {secHead("用量")}
          {chart}
        </div>
      </PullRefresh>

      {/* 图标点开的面板：Todo / Done List / 日记 各一屏 */}
      {panel && <div style={{ position: "fixed", inset: 0, zIndex: 555, display: "flex", flexDirection: "column", backgroundColor: C.bg, paddingTop: "calc(10px + env(safe-area-inset-top, 0px))", boxShadow: "-8px 0 24px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "2px 12px 6px", flexShrink: 0 }}>
          <button className="flat ghost" onClick={() => setPanel(null)} style={{ display: "flex", alignItems: "center", gap: 3, border: "none", background: "transparent", color: C.accent, cursor: "pointer", fontSize: 16, fontFamily: "inherit", padding: "6px 8px" }}><Icon size={20}><polyline points="15 18 9 12 15 6" /></Icon>首页</button>
          <span style={{ flex: 1 }} />
        </div>
        <PullRefresh onRefresh={load} color={C.accent} className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "0 16px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <div style={{ fontSize: 28, lineHeight: 1.25, fontWeight: 800, color: C.text, padding: "2px 4px 14px", letterSpacing: "0.5px" }}>
              {panel === "todo" ? "Todo" : panel === "done" ? "Done List" : "日记"}
            </div>

            {panel === "todo" && <div style={{ ...card, overflow: "hidden" }}>
              {undone.map(todoRow)}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderTop: undone.length ? `1px solid ${C.divider}` : "none" }}>
                <span style={{ width: 21, height: 21, borderRadius: "50%", flexShrink: 0, border: `1.5px dashed ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.placeholder, fontSize: 13 }}>+</span>
                <input value={adding} onChange={e => setAdding(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addTodo(); }} placeholder="加一件要做的事"
                  style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 15.5, fontFamily: "inherit", color: C.text, padding: 0 }} />
                {adding.trim() && <button className="flat" onClick={addTodo} style={{ border: "none", background: C.accent, color: "#fff", borderRadius: 14, padding: "4px 14px", fontSize: 14, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>添加</button>}
              </div>
            </div>}

            {panel === "done" && (done.length === 0
              ? empty(<><circle cx="12" cy="12" r="9" /><polyline points="8.5 12.2 11 14.7 15.8 9.6" /></>, "还没有完成的事", "勾掉的待办会落到这里")
              : <div style={{ ...card, overflow: "hidden" }}>{done.map(todoRow)}</div>)}

            {panel === "diary" && <>
              {entries !== null && entries.length === 0 && empty(<><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></>, "还没有日记", "Cael 用 OB 的 letter_write 写的信件会出现在这里")}
              {entries !== null && entries.length > 0 && <div style={{ ...card, overflow: "hidden" }}>
                {entries.map((e, i) => (
                  <button key={e.id || i} className="flat ghost" onClick={() => setOpen(e)} style={{ width: "100%", display: "block", textAlign: "left", border: "none", borderTop: i > 0 ? `1px solid ${C.divider}` : "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", padding: "14px 16px" }}>
                    <div style={{ fontSize: 17, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title || "无标题"}</div>
                    <div style={{ fontSize: 14.5, color: C.placeholder, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ color: C.textSecondary }}>{fmtDate(e.date)}</span>　{firstLine(e.content)}
                    </div>
                  </button>
                ))}
              </div>}
            </>}
          </div>
        </PullRefresh>
      </div>}

      {open && <div style={{ position: "fixed", inset: 0, zIndex: 560, display: "flex", flexDirection: "column", backgroundColor: C.bg, paddingTop: "calc(10px + env(safe-area-inset-top, 0px))", boxShadow: "-8px 0 24px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "2px 12px 6px", flexShrink: 0 }}>
          <button className="flat ghost" onClick={closeReader} style={{ display: "flex", alignItems: "center", gap: 3, border: "none", background: "transparent", color: C.accent, cursor: "pointer", fontSize: 16, fontFamily: "inherit", padding: "6px 8px" }}><Icon size={20}><polyline points="15 18 9 12 15 6" /></Icon>首页</button>
          <span style={{ flex: 1 }} />
        </div>
        <div className="panel-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehaviorY: "contain", touchAction: "pan-y", padding: "4px 22px calc(30px + env(safe-area-inset-bottom, 0px))" }}>
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{open.title || "无标题"}</div>
            <div style={{ fontSize: 13.5, color: C.placeholder, marginTop: 8, marginBottom: 18 }}>{fmtDate(open.date)}　{open.author}</div>
            <div style={{ fontSize: 16.5, lineHeight: 1.85, color: C.text, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{open.content || "（空）"}</div>
          </div>
        </div>
      </div>}
    </>
  );
}
