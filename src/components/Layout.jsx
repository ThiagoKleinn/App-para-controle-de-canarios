import { NavLink } from 'react-router-dom'
import logo from '../assets/logo.png'

const NAV = [
    { to: '/aves',     icon: 'ti-feather',  label: 'Aves' },
    { to: '/gaiolas',  icon: 'ti-home',     label: 'Gaiolas' },
    { to: '/posturas', icon: 'ti-egg',      label: 'Posturas' },
    { to: '/agenda',   icon: 'ti-bell',     label: 'Agenda' },
]

export default function Layout({ children }) {
    return (
        <div className="app-layout">
            <header className="app-header">
                <img src={logo} alt="Logo" className="app-logo" />
                <span className="app-brand">Meus Pássaros</span>
            </header>
            <main className="page-content">{children}</main>
            <nav className="bottom-nav">
                {NAV.map(({ to, icon, label }) => (
                    <NavLink key={to} to={to} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
                        <i className={`ti ${icon}`} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}