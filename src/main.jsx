import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthGate from './AuthGate.jsx'
import { installAuthFetch } from './auth'

// 必须在任何请求发出之前装上，否则首屏那几个请求不带口令头
installAuthFetch()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </StrictMode>,
)

// 注册 Service Worker（只在生产构建启用，开发时会和 Vite 热更新打架）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
