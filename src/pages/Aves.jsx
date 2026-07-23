import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ESPECIES = ['Canário', 'Pintassilgo', 'Coleiro', 'Sabiá', 'Curió', 'Trinca-ferro', 'Outro']
const SEXOS    = ['Macho', 'Fêmea', 'Indefinido']
const STATUS   = ['Ativo', 'Chocando', 'Filhote', 'Vendido', 'Falecido']

const BADGE = {
    Ativo:    'badge-green',
    Chocando: 'badge-gold',
    Filhote:  'badge-muted',
    Vendido:  'badge-muted',
    Falecido: 'badge-red',
}

const VAZIO = { nome: '', especie: 'Canário', anilha: '', proprietario: '', sexo: 'Macho', nascimento: '', gaiola_id: '', status: 'Ativo', contato: '', registro: '', obs: '' }

export default function Aves() {
    const [aves, setAves]         = useState([])
    const [gaiolas, setGaiolas]   = useState([])
    const [busca, setBusca]       = useState('')
    const [filtro, setFiltro]     = useState('Todas')
    const [sheet, setSheet]       = useState(false)
    const [detalhe, setDetalhe]   = useState(null)
    const [form, setForm]         = useState(VAZIO)
    const [loading, setLoading]   = useState(false)

    useEffect(() => { carregar() }, [])

    async function carregar() {
        const [{ data: a }, { data: g }] = await Promise.all([
            supabase.from('aves').select('*, gaiolas(numero)').order('nome'),
            supabase.from('gaiolas').select('id, numero').order('numero'),
        ])
        setAves(a || [])
        setGaiolas(g || [])
    }

    const ABAS = ['Todas', 'Macho', 'Fêmea', 'Chocando', 'Filhote']

    const filtradas = aves.filter(a => {
        const q = busca.toLowerCase()
        const bate = a.nome?.toLowerCase().includes(q) || a.anilha?.toLowerCase().includes(q) || a.especie?.toLowerCase().includes(q)
        if (!bate) return false
        if (filtro === 'Todas') return true
        if (filtro === 'Macho' || filtro === 'Fêmea') return a.sexo === filtro
        return a.status === filtro
    })

    function abrirNova() { setForm(VAZIO); setDetalhe(null); setSheet(true) }
    function abrirDetalhe(ave) { setDetalhe(ave); setForm({ ...ave, gaiola_id: ave.gaiola_id || '' }); setSheet(true) }

    function campo(k, v) { setForm(f => ({ ...f, [k]: v })) }

    async function salvar() {
        setLoading(true)
        const payload = { ...form, gaiola_id: form.gaiola_id || null }
        if (detalhe) {
            await supabase.from('aves').update(payload).eq('id', detalhe.id)
        } else {
            await supabase.from('aves').insert(payload)
        }
        await carregar()
        setSheet(false)
        setLoading(false)
    }

    async function excluir() {
        if (!confirm(`Excluir ${detalhe.nome}?`)) return
        await supabase.from('aves').delete().eq('id', detalhe.id)
        await carregar()
        setSheet(false)
    }

    return (
        <>
            <div className="top-bar">
                <div>
                    <h1>Minhas Aves</h1>
                    <p>{aves.length} cadastrada{aves.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            <div className="page-content" style={{ paddingTop: 0 }}>
                <div className="search-bar">
                    <i className="ti ti-search" style={{ color: 'var(--muted)', fontSize: 18 }} />
                    <input placeholder="Nome, anilha ou espécie..." value={busca} onChange={e => setBusca(e.target.value)} />
                </div>

                <div className="tabs">
                    {ABAS.map(a => (
                        <div key={a} className={'tab' + (filtro === a ? ' active' : '')} onClick={() => setFiltro(a)}>{a}</div>
                    ))}
                </div>

                {filtradas.length === 0
                    ? <div className="empty"><i className="ti ti-feather" /><p>Nenhuma ave encontrada</p></div>
                    : filtradas.map(ave => (
                        <div key={ave.id} className="card" onClick={() => abrirDetalhe(ave)} style={{ cursor: 'pointer' }}>
                            <div className="card-header">
                                <div>
                                    <div className="card-title">{ave.nome}</div>
                                    <div className="card-sub">{ave.especie} · Anilha {ave.anilha || '—'}</div>
                                </div>
                                <span className={`badge ${BADGE[ave.status] || 'badge-muted'}`}>{ave.status}</span>
                            </div>
                            <div className="divider" />
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
                                <span><i className="ti ti-home" /> {ave.gaiolas?.numero ? `Gaiola ${ave.gaiolas.numero}` : 'Sem gaiola'}</span>
                                <span><i className={`ti ti-gender-${ave.sexo === 'Macho' ? 'male' : ave.sexo === 'Fêmea' ? 'female' : 'bigender'}`} /> {ave.sexo}</span>
                                {ave.nascimento && <span><i className="ti ti-calendar" /> {ave.nascimento.substring(0, 4)}</span>}
                            </div>
                        </div>
                    ))
                }
            </div>

            <button className="fab" onClick={abrirNova}><i className="ti ti-plus" /></button>

            {sheet && (
                <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setSheet(false)}>
                    <div className="sheet">
                        <div className="sheet-handle" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="sheet-title">{detalhe ? 'Editar ave' : 'Nova ave'}</div>
                            {detalhe && <button className="btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red-bg)' }} onClick={excluir}>Excluir</button>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nome</label>
                            <input className="form-input" value={form.nome} onChange={e => campo('nome', e.target.value)} placeholder="Ex: Amarelão" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Espécie</label>
                            <select className="form-select" value={form.especie} onChange={e => campo('especie', e.target.value)}>
                                {ESPECIES.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                                <label className="form-label">Anilha</label>
                                <input className="form-input" value={form.anilha} onChange={e => campo('anilha', e.target.value)} placeholder="A-041" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Sexo</label>
                                <select className="form-select" value={form.sexo} onChange={e => campo('sexo', e.target.value)}>
                                    {SEXOS.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                                <label className="form-label">Nascimento</label>
                                <input className="form-input" type="date" value={form.nascimento} onChange={e => campo('nascimento', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={form.status} onChange={e => campo('status', e.target.value)}>
                                    {STATUS.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gaiola</label>
                            <select className="form-select" value={form.gaiola_id} onChange={e => campo('gaiola_id', e.target.value)}>
                                <option value="">Sem gaiola</option>
                                {gaiolas.map(g => <option key={g.id} value={g.id}>Gaiola {g.numero}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Proprietário</label>
                            <input className="form-input" value={form.proprietario} onChange={e => campo('proprietario', e.target.value)} placeholder="Nome do dono" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contato</label>
                            <input className="form-input" value={form.contato} onChange={e => campo('contato', e.target.value)} placeholder="Telefone" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Registro</label>
                            <input className="form-input" value={form.registro} onChange={e => campo('registro', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Observações</label>
                            <textarea className="form-textarea" value={form.obs} onChange={e => campo('obs', e.target.value)} placeholder="Observações adicionais..." />
                        </div>
                        <button className="btn-primary" onClick={salvar} disabled={loading || !form.nome || !form.especie}>
                            {loading ? 'Salvando...' : detalhe ? 'Salvar alterações' : 'Cadastrar ave'}
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}