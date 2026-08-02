// 各页面共用的 24×24 线性图标外壳，children 传 path/circle 等形状
export default function Icon({ children, size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}
