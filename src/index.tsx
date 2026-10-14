/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')

// 构建时 tools/seo.ts 会向 #root 注入静态 HTML（供不执行 JS 的爬虫读取），
// 挂载前先清空，避免与客户端渲染的内容重复。
root!.textContent = ''
render(() => <App />, root!)
