import { useRef, useState } from "react";

// 下拉刷新：滚到顶部继续下拉，超过阈值松手触发 onRefresh
// 用法：<PullRefresh onRefresh={async()=>{...}} className="panel-scroll" style={{...}}>内容</PullRefresh>
export default function PullRefresh({ onRefresh, className, style, color = "#888", disabled = false, children }) {
  const ref = useRef(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullVal = useRef(0);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const THRESH = 64;

  if (disabled) return <div className={className} style={style}>{children}</div>;

  const onTouchStart = (e) => {
    if (refreshing) return;
    if ((ref.current?.scrollTop || 0) <= 0) { startY.current = e.touches[0].clientY; pulling.current = true; }
  };
  const onTouchMove = (e) => {
    if (!pulling.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && (ref.current?.scrollTop || 0) <= 0) {
      const v = Math.min(90, dy * 0.5);
      pullVal.current = v; setPull(v);
      if (e.cancelable) e.preventDefault();
    } else { pulling.current = false; pullVal.current = 0; setPull(0); }
  };
  const onTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullVal.current >= THRESH) {
      setRefreshing(true); setPull(THRESH);
      try { await onRefresh(); } catch (e) {}
      setRefreshing(false);
    }
    pullVal.current = 0; setPull(0);
  };

  const active = pull > 0 || refreshing;
  return (
    <div ref={ref} className={className} style={{ ...style, position: "relative" }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      <div style={{ position: "sticky", top: 0, height: 0, zIndex: 3, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ marginTop: Math.max(0, (refreshing ? THRESH : pull) - 26), opacity: active ? 1 : 0, transition: pulling.current ? "none" : "margin-top 0.25s ease, opacity 0.2s ease" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round"
            style={{ transform: refreshing ? "none" : `rotate(${pull / THRESH * 270}deg)`, animation: refreshing ? "ptrSpin 0.7s linear infinite" : "none" }}>
            <path d="M21 12a9 9 0 1 1-6.2-8.5" />
            {!refreshing && <polyline points="21 3 21 8 16 8" />}
          </svg>
        </div>
      </div>
      <div style={{ transform: `translateY(${refreshing ? THRESH : pull}px)`, transition: pulling.current ? "none" : "transform 0.25s cubic-bezier(0.22,0.61,0.36,1)" }}>
        {children}
      </div>
    </div>
  );
}
