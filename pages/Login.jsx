import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
    const [email, setEmail]     = useState('')
    const [senha, setSenha]     = useState('')
    const [erro, setErro]       = useState('')
    const [loading, setLoading] = useState(false)

    async function entrar(e) {
        e.preventDefault()
        setErro('')
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) setErro('E-mail ou senha incorretos.')
        setLoading(false)
    }

    return (
        <div className="login-page">
            <div className="login-logo">🐦 Plantel</div>
            <p className="login-sub">Gestão de pássaros</p>
            <form className="login-form" onSubmit={entrar}>
                <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input
                        className="form-input"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Senha</label>
                    <input
                        className="form-input"
                        type="password"
                        placeholder="••••••••"
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                        required
                    />
                </div>
                {erro && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{erro}</p>}
                <button className="btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        </div>
    )
}