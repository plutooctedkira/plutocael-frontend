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
    // 需要明显的水平位移才判定为滑动，避免点击时的微小抖动露出删除
    if (dir.current === null) { if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return; dir.current = Math.abs(dx) > Math.abs(dy) * 1.3 ? "h" : "v"; }
    if (dir.current !== "h") return;
    if (e.cancelable) e.preventDefault();
    const base = x <= -W ? -W : 0;
    setX(Math.max(-W - 20, Math.min(0, base + dx)));
  };
  const onEnd = () => { if (!tracking.current) return; tracking.current = false; if (dir.current === "h") setX(x < -W / 2 ? -W : 0); };
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: radius }}>
      <button onClick={() => { setX(0); onDelete && onDelete(); }} style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: W, border: "none", borderRadius: `0 ${radius}px ${radius}px 0`, background: "#D9534F", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: x < -2 ? 1 : 0 }}>{deleteLabel}</button>
      <div onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}
        style={{ transform: `translateX(${x}px)`, transition: tracking.current ? "none" : "transform 0.25s cubic-bezier(0.22,0.61,0.36,1)", position: "relative", zIndex: 1, willChange: "transform", touchAction: "pan-y" }}>
        {children}
      </div>
    </div>
  );
}
