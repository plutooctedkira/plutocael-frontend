import { useRef, useState } from "react";

// 左滑露出删除按钮（微信式）。onDelete 点删除时触发；children 是行内容
export default function SwipeRow({ onDelete, children, deleteLabel = "删除", radius = 12 }) {
  const startX = useRef(0), startY = useRef(0), tracking = useRef(false), dir = useRef(null);
  const [x, setX] = useState(0); // 当前左移距离(负值)
  const W = 64; // 删除按钮宽度
  const onStart = (e) => { startX.current = e.touches[0].clientX; startY.current = e.touches[0].clientY; tracking.current = true; dir.current = null; };
  const onMove = (e) => {
    if (!tracking.current) return;
    const dx = e.touches[0].clientX - startX.current, dy = e.touches[0].clientY - startY.current;
    if (dir.current === null) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; dir.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v"; }
    if (dir.current !== "h") return;
    if (e.cancelable) e.preventDefault();
    const base = x <= -W ? -W : 0;
    setX(Math.max(-W - 20, Math.min(0, base + dx)));
  };
  const onEnd = () => { if (!tracking.current) return; tracking.current = false; setX(x < -W / 2 ? -W : 0); };
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: radius }}>
      <button onClick={() => { setX(0); onDelete && onDelete(); }} style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: W, border: "none", background: "#D9534F", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{deleteLabel}</button>
      <div onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}
        style={{ transform: `translateX(${x}px)`, transition: tracking.current ? "none" : "transform 0.25s cubic-bezier(0.22,0.61,0.36,1)", position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
