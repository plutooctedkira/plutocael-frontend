import { useRef, useState } from "react";

// 左滑露出操作按钮（微信式）。children 是行内容
// 单个删除：<SwipeRow onDelete={fn} />
// 多个动作：<SwipeRow actions={[{label:"编辑", bg:"#888", onClick:fn}, ...]} />（左起排列）
export default function SwipeRow({ onDelete, actions, children, deleteLabel = "删除", radius = 12 }) {
  const acts = (actions && actions.length) ? actions : [{ label: deleteLabel, bg: "#D9534F", onClick: onDelete }];
  const startX = useRef(0), startY = useRef(0), tracking = useRef(false), dir = useRef(null);
  const [x, setX] = useState(0); // 当前左移距离(负值)
  const ONE = 64;            // 每个按钮露出的宽度
  const W = ONE * acts.length; // 全部露出时的总宽度
  const OVER = 24;   // 回弹余量：最左那个按钮比 ONE 宽这么多，滑过头也不会露出容器底色

  // 全局返回手势挂在 document 上（非聊天页任意处右滑>60px 即返回），
  // 这里横向滑动时必须掐断冒泡，否则收起删除按钮的动作会被当成"返回上一级"
  const stop = (e) => { e.stopPropagation(); if (e.nativeEvent && e.nativeEvent.stopPropagation) e.nativeEvent.stopPropagation(); };

  const onStart = (e) => {
    startX.current = e.touches[0].clientX; startY.current = e.touches[0].clientY;
    tracking.current = true; dir.current = null;
    if (x < 0) stop(e); // 已经滑开的行：这一下多半是要收起来，别让全局手势插手
  };
  const onMove = (e) => {
    if (!tracking.current) return;
    const dx = e.touches[0].clientX - startX.current, dy = e.touches[0].clientY - startY.current;
    // 需要明显的水平位移才判定为滑动，避免点击时的微小抖动露出删除
    if (dir.current === null) { if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return; dir.current = Math.abs(dx) > Math.abs(dy) * 1.3 ? "h" : "v"; }
    if (dir.current !== "h") return;
    stop(e);
    if (e.cancelable) e.preventDefault();
    const base = x <= -W ? -W : 0;
    setX(Math.max(-W - OVER, Math.min(0, base + dx)));
  };
  const onEnd = (e) => {
    if (!tracking.current) return;
    tracking.current = false;
    if (dir.current === "h") { stop(e); setX(x < -W / 2 ? -W : 0); }
  };

  const open = x < -2;
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: radius }}>
      {/* 整条比 W 宽 OVER，且靠右贴死：滑过头时露出来的仍是按钮色而不是容器底色 */}
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: W + OVER, display: "flex", opacity: open ? 1 : 0 }}>
        {acts.map((a, i) => {
          const first = i === 0, last = i === acts.length - 1;
          return <button key={i} onClick={() => { setX(0); a.onClick && a.onClick(); }}
            style={{ width: first ? ONE + OVER : ONE, flexShrink: 0, padding: 0, border: "none", borderRadius: last ? `0 ${radius}px ${radius}px 0` : 0, background: a.bg || "#D9534F", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            {/* 文字居中在实际露出的那 ONE 宽度里，最左边多出的 OVER 藏在卡片下面 */}
            <span style={{ width: ONE, textAlign: "center", flexShrink: 0 }}>{a.label}</span>
          </button>;
        })}
      </div>
      {/* 滑开时把右侧圆角掰直，卡片才能和红块严丝合缝（靠 CSS 改 children 的圆角） */}
      <div className={open ? "swipe-open" : undefined}
        onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}
        style={{ transform: `translateX(${x}px)`, transition: tracking.current ? "none" : "transform 0.25s cubic-bezier(0.22,0.61,0.36,1)", position: "relative", zIndex: 1, willChange: "transform", touchAction: "pan-y" }}>
        {children}
      </div>
    </div>
  );
}
