import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TIPOS = ['Ovoscopia', 'Anilhamento', 'Vacinação', 'Medicação', 'Visita veterinária', 'Limpeza', 'Outro']
const PRIORIDADES = ['Alta', 'Normal', 'Baixa']

const BADGE_PRIOR = {
    Alta:   'badge-red',
    Normal: 'badge-gold',
    Baixa:  'badge-muted',
}

const ICON_TIPO = {
    Ovoscopia:           'ti-eye',
    Anilhamento:         'ti-tag',
    Vacinação:           'ti-vaccine',
    Medicação:           'ti-pill',
    'Visita veterinária':'ti-stethoscope',
    Limpeza:             'ti-wash',
    Outro:               'ti-calendar-event',
}

const DOT_PRIOR = {
    Alta:   'var(--red)',
    Normal: 'var(--gold)',
    Baixa:  'var(--muted)',
}

const VAZIO = { titulo: '', tipo: 'Ovoscopia', data: '', hora: '', prioridade: 'Normal', ave_id: '', obs: '', concluido: false }

function fmt(dateStr) {
    if (!dateStr) return '—'
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

function hoje() {
    return new Date().toISOString().substring(0, 10)
}

function diasRestantes(dataStr) {
    if (!dataStr) return null
    const diff = Math.ceil((new Date(dataStr) - new Date(hoje())) / 86400000)
    return diff
}

function labelDias(diff) {
    if (diff === null) return null
    if (diff < 0)  return { texto: `${Math.abs(diff)}d atraso`, cor: 'var(--red)' }
    if (diff === 0) return { texto: 'Hoje', cor: 'var(--gold)' }
    if (diff === 1) return { texto: 'Amanhã', cor: 'var(--gold)' }
    return { texto: `Em ${diff}d`, cor: 'var(--muted)' }
}

export default function Agenda() {
    const [eventos, setEventos]   = useState([])
    const [aves, setAves]         = useState([])
    const [sheet, setSheet]       = useState(false)
    const [detalhe, setDetalhe]   = useState(null)
    const [form, setForm]         = useState(VAZIO)
    const [loading, setLoading]   = useState(false)
    const [filtro, setFiltro]     = useState('Pendentes')

    useEffect(() => { carregar() }, [])

    async function carregar() {
        const [{ data: ev }, { data: av }] = await Promise.all([
            supabase.from('agenda').select('*, aves(nome, anilha)').order('data').order('hora'),
            supabase.from('aves').select('id, nome, anilha').order('nome'),
        ])
        setEventos(ev || [])
        setAves(av || [])
    }

    function abrirNovo() { setForm({ ...VAZIO, data: hoje() }); setDetalhe(null); setSheet(true) }
    function abrirDetalhe(ev) { setDetalhe(ev); setForm({ ...ev, ave_id: ev.ave_id || '' }); setSheet(true) }
    function campo(k, v) { setForm(f => ({ ...f, [k]: v })) }

    async function salvar() {
        setLoading(true)
        const payload = {
            titulo:     form.titulo,
            tipo:       form.tipo,
            data:       form.data || null,
            hora:       form.hora || null,
            prioridade: form.prioridade,
            ave_id:     form.ave_id || null,
            obs:        form.obs,
            concluido:  form.concluido,
        }
        if (detalhe) {
            await supabase.from('agenda').update(payload).eq('id', detalhe.id)
        } else {
            await supabase.from('agenda').insert(payload)
        }
        await carregar()
        setSheet(false)
        setLoading(false)
    }

    async function toggleConcluido(ev) {
        await supabase.from('agenda').update({ concluido: !ev.concluido }).eq('id', ev.id)
        await carregar()
    }

    async function excluir() {
        if (!confirm('Excluir este evento?')) return
        await supabase.from('agenda').delete().eq('id', detalhe.id)
        await carregar()
        setSheet(false)
    }

    const ABAS = ['Pendentes', 'Hoje', 'Concluídos']

    const filtrados = eventos.filter(ev => {
        if (filtro === 'Pendentes')  return !ev.concluido
        if (filtro === 'Hoje')       return ev.data === hoje() && !ev.concluido
        if (filtro === 'Concluídos') return ev.concluido
        return true
    })

    // agrupar por data
    const grupos = filtrados.reduce((acc, ev) => {
        const key = ev.data || 'sem-data'
        if (!acc[key]) acc[key] = []
        acc[key].push(ev)
        return acc
    }, {})

    const pendentesHoje = eventos.filter(ev => !ev.concluido && ev.data === hoje()).length
    const atrasados     = eventos.filter(ev => !ev.concluido && ev.data && ev.data < hoje()).length

    return (
        <>
            <div className="top-bar">
                <div>
                    <h1>Agenda</h1>
                    <p>
                        {pendentesHoje > 0 ? `${pendentesHoje} tarefa${pendentesHoje !== 1 ? 's' : ''} para hoje` : 'Nada para hoje'}
                        {atrasados > 0 ? ` · ${atrasados} atrasada${atrasados !== 1 ? 's' : ''}` : ''}
                    </p>
                </div>
            </div>

            <div className="page-content" style={{ paddingTop: 0 }}>
                <div className="tabs">
                    {ABAS.map(a => (
                        <div key={a} className={'tab' + (filtro === a ? ' active' : '')} onClick={() => setFiltro(a)}>{a}</div>
                    ))}
                </div>

                {filtrados.length === 0 ? (
                    <div className="empty">
                        <i className="ti ti-bell-off" />
                        <p>{filtro === 'Hoje' ? 'Nada agendado para hoje' : filtro === 'Concluídos' ? 'Nenhuma tarefa concluída' : 'Nenhuma tarefa pendente'}</p>
                    </div>
                ) : (
                    Object.entries(grupos)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([data, evs]) => {
                            const diff = diasRestantes(data === 'sem-data' ? null : data)
                            const info = labelDias(diff)
                            return (
                                <div key={data}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="section-title">
                                        <span>{data === 'sem-data' ? 'Sem data' : fmt(data)}</span>
                                        {info && !filtro.includes('Conclui') && (
                                            <span style={{ color: info.cor, fontSize: 11, fontWeight: 500 }}>{info.texto}</span>
                                        )}
                                    </div>
                                    {evs.map(ev => {
                                        const icon = ICON_TIPO[ev.tipo] || 'ti-calendar-event'
                                        return (
                                            <div
                                                key={ev.id}
                                                className="card"
                                                style={{ cursor: 'pointer', opacity: ev.concluido ? 0.55 : 1 }}
                                                onClick={() => abrirDetalhe(ev)}
                                            >
                                                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                                    {/* dot de prioridade */}
                                                    <div
                                                        className="agenda-dot"
                                                        style={{ background: ev.concluido ? 'var(--muted)' : DOT_PRIOR[ev.prioridade] }}
                                                    />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                                            <div>
                                                                <div className="card-title" style={{ textDecoration: ev.concluido ? 'line-through' : 'none' }}>
                                                                    {ev.titulo}
                                                                </div>
                                                                <div className="card-sub" style={{ marginTop: 2 }}>
                                                                    <i className={`ti ${icon}`} style={{ fontSize: 12 }} /> {ev.tipo}
                                                                    {ev.hora && <span> · {ev.hora.substring(0, 5)}</span>}
                                                                    {ev.aves?.nome && <span> · {ev.aves.nome}</span>}
                                                                </div>
                                                            </div>
                                                            <button
                                                                style={{
                                                                    width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${ev.concluido ? 'var(--green)' : 'var(--border)'}`,
                                                                    background: ev.concluido ? 'var(--green-bg)' : 'transparent',
                                                                    color: ev.concluido ? 'var(--green)' : 'var(--muted)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    cursor: 'pointer', flexShrink: 0, fontSize: 14,
                                                                }}
                                                                onClick={e => { e.stopPropagation(); toggleConcluido(ev) }}
                                                            >
                                                                {ev.concluido ? <i className="ti ti-check" /> : ''}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })
                )}
            </div>

            <button className="fab" onClick={abrirNovo}><i className="ti ti-plus" /></button>

            {sheet && (
                <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setSheet(false)}>
                    <div className="sheet">
                        <div className="sheet-handle" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="sheet-title">{detalhe ? 'Editar evento' : 'Novo evento'}</div>
                            {detalhe && (
                                <button className="btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red-bg)' }} onClick={excluir}>
                                    Excluir
                                </button>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Título</label>
                            <input className="form-input" value={form.titulo} onChange={e => campo('titulo', e.target.value)} placeholder="Ex: Ovoscopia da postura 3" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                                <label className="form-label">Tipo</label>
                                <select className="form-select" value={form.tipo} onChange={e => campo('tipo', e.target.value)}>
                                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Prioridade</label>
                                <select className="form-select" value={form.prioridade} onChange={e => campo('prioridade', e.target.value)}>
                                    {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                                <label className="form-label">Data</label>
                                <input className="form-input" type="date" value={form.data} onChange={e => campo('data', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hora</label>
                                <input className="form-input" type="time" value={form.hora} onChange={e => campo('hora', e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Ave relacionada</label>
                            <select className="form-select" value={form.ave_id} onChange={e => campo('ave_id', e.target.value)}>
                                <option value="">Nenhuma</option>
                                {aves.map(a => <option key={a.id} value={a.id}>{a.nome}{a.anilha ? ` (${a.anilha})` : ''}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Observações</label>
                            <textarea className="form-textarea" value={form.obs} onChange={e => campo('obs', e.target.value)} placeholder="Observações adicionais..." />
                        </div>

                        {detalhe && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                <div
                                    style={{
                                        width: 36, height: 20, borderRadius: 10, background: form.concluido ? 'var(--green)' : 'var(--surface2)',
                                        border: `1px solid ${form.concluido ? 'var(--green)' : 'var(--border)'}`,
                                        display: 'flex', alignItems: 'center', padding: '0 3px',
                                        cursor: 'pointer', transition: 'background 0.2s',
                                    }}
                                    onClick={() => campo('concluido', !form.concluido)}
                                >
                                    <div style={{
                                        width: 14, height: 14, borderRadius: '50%', background: '#fff',
                                        transform: form.concluido ? 'translateX(16px)' : 'translateX(0)',
                                        transition: 'transform 0.2s',
                                    }} />
                                </div>
                                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Marcar como concluído</span>
                            </div>
                        )}

                        <button className="btn-primary" onClick={salvar} disabled={loading || !form.titulo}>
                            {loading ? 'Salvando...' : detalhe ? 'Salvar alterações' : 'Criar evento'}
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}