import { useEffect, useRef, useState } from "react";

// 下拉刷新：滚到顶部继续下拉，超过阈值松手触发 onRefresh
// 用法：<PullRefresh onRefresh={async()=>{...}} className="panel-scroll" style={{...}}>内容</PullRefresh>
export default function PullRefresh({ onRefresh, className, style, color = "#888", disabled = false, children }) {
  const ref = useRef(null);
  const startY = useRef(0);
  const startX = useRef(0);
  const pulling = useRef(false);
  const locked = useRef(false);   // 这一次手势方向已经判定过了
  const pullVal = useRef(0);
  const busy = useRef(false);     // 刷新中（给原生监听器看的，state 在闭包里是旧的）
  const cb = useRef(onRefresh);
  cb.current = onRefresh;
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const THRESH = 64;

  // 监听器必须自己用 addEventListener 挂：React 的 onTouchMove 是 passive 的，
  // 里面 preventDefault 会被浏览器忽略 —— iOS 上就变成「橡皮筋回弹 + 自己的位移」两股力打架，
  // 拖一下弹回去，看着像整页翻不动。passive:false 才拦得住原生滚动。
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const reset = () => { pulling.current = false; locked.current = false; pullVal.current = 0; setPull(0); };

    const onStart = (e) => {
      if (busy.current) return;
      locked.current = false;
      if ((el.scrollTop || 0) <= 0) { startY.current = e.touches[0].clientY; startX.current = e.touches[0].clientX; pulling.current = true; }
    };
    const onMove = (e) => {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      const dx = e.touches[0].clientX - startX.current;
      // 方向锁：横滑是返回手势，别抢；判定前先不拦
      if (!locked.current) {
        if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
        if (Math.abs(dx) > Math.abs(dy)) return reset();
        locked.current = true;
      }
      if (dy > 0 && (el.scrollTop || 0) <= 0) {
        const v = Math.min(90, dy * 0.5);
        pullVal.current = v; setPull(v);
        if (e.cancelable) e.preventDefault();
      } else reset();
    };
    const onEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false; locked.current = false;
      if (pullVal.current >= THRESH) {
        busy.current = true;
        setRefreshing(true); setPull(THRESH);
        try { await cb.current(); } catch (err) {}
        busy.current = false;
        setRefreshing(false);
      }
      pullVal.current = 0; setPull(0);
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [disabled]);

  if (disabled) return <div className={className} style={style}>{children}</div>;

  const active = pull > 0 || refreshing;
  return (
    <div ref={ref} className={className} style={{ ...style, position: "relative" }}>
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
