import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import Login from './pages/Login.jsx'
import Layout from './components/Layout.jsx'
import Aves from './pages/Aves.jsx'
import Gaiolas from './pages/Gaiolas.jsx'
import Posturas from './pages/Posturas.jsx'
import Agenda from './pages/Agenda.jsx'

export default function App() {
    const session = useAuth()

    if (session === undefined) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <i className="ti ti-feather" style={{ fontSize: 32, color: 'var(--gold)', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        )
    }

    if (!session) return <Login />

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Navigate to="/aves" replace />} />
                <Route path="/aves"     element={<Aves />} />
                <Route path="/gaiolas"  element={<Gaiolas />} />
                <Route path="/posturas" element={<Posturas />} />
                <Route path="/agenda"   element={<Agenda />} />
                <Route path="*"         element={<Navigate to="/aves" replace />} />
            </Routes>
        </Layout>
    )
}