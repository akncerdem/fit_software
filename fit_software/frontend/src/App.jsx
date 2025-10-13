import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE } from './config'

export default function App() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    axios.get(`${API_BASE}/api/health/`).then(res => setHealth(res.data)).catch(() => setHealth({ status: 'error' }))
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Fitware</h1>
      <p>Welcome 👋 This is your React + Vite frontend.</p>
      <section style={{ marginTop: 16, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
        <h2>Backend Health</h2>
        <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6 }}>
{JSON.stringify(health, null, 2)}
        </pre>
      </section>
    </div>
  )
}