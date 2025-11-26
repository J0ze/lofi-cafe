import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 移除 StrictMode，防止开发环境下重复请求导致网易云 API 限流
createRoot(document.getElementById('root')).render(
    <App />
)