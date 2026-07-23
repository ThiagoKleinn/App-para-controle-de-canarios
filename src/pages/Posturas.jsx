import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUS_OVO = ['Aguardando ovoscopia', 'Fértil', 'Infértil', 'Nascido', 'Morto no ovo']
const BADGE_OVO = {
    'Aguardando ovoscopia': 'badge-muted',
    'Fértil':               'badge-gold',
    'Infértil':             'badge-red',
    'Nascido':              'badge-green',
    'Morto no ovo':         'badge-red',
}

const VAZIO_POSTURA = { gaiola_id: '', ave_femea_id: '', ave_macho_id: '', anel_mc: '', anel_fm: '', postura_em: '', inicio_choco_em: '', nascidos_em: '', anel_fts: '', obs: '' }

function addDias(dataStr, dias) {
    if (!dataStr) return ''
    const d = new Date(dataStr)
    d.setDate(d.getDate() + dias)
    return d.toISOString().substring(0, 10)
}

function fmt(dateStr) {
    if (!dateStr) return '—'
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
}

export default function Posturas() {
    const [posturas, setPosturas]         = useState([])
    const [aves, setAves]                 = useState([])
    const [gaiolas, setGaiolas]           = useState([])
    const [sheet, setSheet]               = useState(false)
    const [detalhe, setDetalhe]           = useState(null) // postura aberta
    const [form, setForm]                 = useState(VAZIO_POSTURA)
    const [loading, setLoading]           = useState(false)

    useEffect(() => { carregar() }, [])

    async function carregar() {
        const [{ data: p }, { data: a }, { data: g }] = await Promise.all([
            supabase.from('posturas').select(`
        *, 
        gaiolas(numero),
        femea:aves!posturas_ave_femea_id_fkey(nome, anilha),
        macho:aves!posturas_ave_macho_id_fkey(nome, anilha),
        ovos(*)
      `).order('postura_em', { ascending: false }),
            supabase.from('aves').select('id, nome, anilha, sexo, status').order('nome'),
            supabase.from('gaiolas').select('id, numero').order('numero'),
        ])
        setPosturas(p || [])
        setAves(a || [])
        setGaiolas(g || [])
    }

    function abrirNova() { setForm(VAZIO_POSTURA); setDetalhe(null); setSheet(true) }
    function abrirDetalhe(p) { setDetalhe(p); setForm({ ...p, gaiola_id: p.gaiola_id || '', ave_femea_id: p.ave_femea_id || '', ave_macho_id: p.ave_macho_id || '' }); setSheet(true) }
    function campo(k, v) { setForm(f => ({ ...f, [k]: v })) }

    async function salvar() {
        setLoading(true)
        const payload = {
            gaiola_id: form.gaiola_id || null,
            ave_femea_id: form.ave_femea_id || null,
            ave_macho_id: form.ave_macho_id || null,
            anel_mc: form.anel_mc,
            anel_fm: form.anel_fm,
            postura_em: form.postura_em || null,
            inicio_choco_em: form.inicio_choco_em || null,
            nascidos_em: form.nascidos_em || null,
            anel_fts: form.anel_fts,
            obs: form.obs,
        }
        if (detalhe) {
            await supabase.from('posturas').update(payload).eq('id', detalhe.id)
        } else {
            const { data: nova } = await supabase.from('posturas').insert(payload).select().single()
            // cria 5 ovos padrão
            if (nova) {
                const ovos = Array.from({ length: 5 }, (_, i) => ({ postura_id: nova.id, numero: i + 1, status: 'Aguardando ovoscopia' }))
                await supabase.from('ovos').insert(ovos)
            }
        }
        await carregar()
        setSheet(false)
        setLoading(false)
    }

    async function atualizarOvo(ovoId, status) {
        await supabase.from('ovos').update({ status }).eq('id', ovoId)
        await carregar()
        // re-abre detalhe atualizado
        const { data } = await supabase.from('posturas').select(`
      *, gaiolas(numero),
      femea:aves!posturas_ave_femea_id_fkey(nome, anilha),
      macho:aves!posturas_ave_macho_id_fkey(nome, anilha),
      ovos(*)
    `).eq('id', detalhe.id).single()
        if (data) setDetalhe(data)
    }

    async function excluir() {
        if (!confirm('Excluir esta postura?')) return
        await supabase.from('ovos').delete().eq('postura_id', detalhe.id)
        await supabase.from('posturas').delete().eq('id', detalhe.id)
        await carregar()
        setSheet(false)
    }

    const machos  = aves.filter(a => a.sexo === 'Macho')
    const femeas  = aves.filter(a => a.sexo === 'Fêmea')

    const STATUS_POSTURA = (p) => {
        const ovos = p.ovos || []
        if (ovos.some(o => o.status === 'Nascido')) return { label: 'Com filhotes', cls: 'badge-green' }
        if (p.inicio_choco_em) return { label: 'Chocando', cls: 'badge-gold' }
        return { label: 'Aguardando', cls: 'badge-muted' }
    }

    return (
        <>
            <div className="top-bar">
                <div>
                    <h1>Posturas</h1>
                    <p>{posturas.length} registro{posturas.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            <div className="page-content" style={{ paddingTop: 0 }}>
                {posturas.length === 0
                    ? <div className="empty"><i className="ti ti-egg" /><p>Nenhuma postura registrada</p></div>
                    : posturas.map(p => {
                        const st = STATUS_POSTURA(p)
                        const nascimento = p.inicio_choco_em ? addDias(p.inicio_choco_em, 14) : null
                        const ovos = p.ovos || []
                        const nascidos = ovos.filter(o => o.status === 'Nascido').length
                        return (
                            <div key={p.id} className="card" onClick={() => abrirDetalhe(p)} style={{ cursor: 'pointer' }}>
                                <div className="card-header">
                                    <div>
                                        <div className="card-title">
                                            {p.femea?.nome || '—'} × {p.macho?.nome || '—'}
                                        </div>
                                        <div className="card-sub">
                                            {p.gaiolas?.numero ? `Gaiola ${p.gaiolas.numero}` : 'Sem gaiola'} · Postura {fmt(p.postura_em)}
                                        </div>
                                    </div>
                                    <span className={`badge ${st.cls}`}>{st.label}</span>
                                </div>
                                <div className="divider" />
                                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
                                    <span><i className="ti ti-egg" /> {ovos.length} ovo{ovos.length !== 1 ? 's' : ''}</span>
                                    {nascidos > 0 && <span style={{ color: 'var(--green)' }}><i className="ti ti-heart" /> {nascidos} nascido{nascidos !== 1 ? 's' : ''}</span>}
                                    {nascimento && <span><i className="ti ti-calendar" /> Prev. {fmt(nascimento)}</span>}
                                </div>
                            </div>
                        )
                    })
                }
            </div>

            <button className="fab" onClick={abrirNova}><i className="ti ti-plus" /></button>

            {sheet && !detalhe && (
                <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setSheet(false)}>
                    <div className="sheet">
                        <div className="sheet-handle" />
                        <div className="sheet-title">Nova postura</div>

                        <div className="form-group">
                            <label className="form-label">Gaiola</label>
                            <select className="form-select" value={form.gaiola_id} onChange={e => campo('gaiola_id', e.target.value)}>
                                <option value="">Selecione...</option>
                                {gaiolas.map(g => <option key={g.id} value={g.id}>Gaiola {g.numero}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                                <label className="form-label">Fêmea (FM)</label>
                                <select className="form-select" value={form.ave_femea_id} onChange={e => campo('ave_femea_id', e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {femeas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Macho (MC)</label>
                                <select className="form-select" value={form.ave_macho_id} onChange={e => campo('ave_macho_id', e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {machos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                                <label className="form-label">Anel MC</label>
                                <input className="form-input" value={form.anel_mc} onChange={e => campo('anel_mc', e.target.value)} placeholder="Ex: A-041" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Anel FM</label>
                                <input className="form-input" value={form.anel_fm} onChange={e => campo('anel_fm', e.target.value)} placeholder="Ex: B-017" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                                <label className="form-label">Postura em</label>
                                <input className="form-input" type="date" value={form.postura_em} onChange={e => campo('postura_em', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Início do choco</label>
                                <input className="form-input" type="date" value={form.inicio_choco_em} onChange={e => campo('inicio_choco_em', e.target.value)} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="form-group">
                                <label className="form-label">Nascidos em</label>
                                <input className="form-input" type="date" value={form.nascidos_em} onChange={e => campo('nascidos_em', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Anéis FTS nº</label>
                                <input className="form-input" value={form.anel_fts} onChange={e => campo('anel_fts', e.target.value)} placeholder="Ex: 01-05" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Observações</label>
                            <textarea className="form-textarea" value={form.obs} onChange={e => campo('obs', e.target.value)} placeholder="Observações..." />
                        </div>
                        <button className="btn-primary" onClick={salvar} disabled={loading}>
                            {loading ? 'Salvando...' : 'Registrar postura'}
                        </button>
                    </div>
                </div>
            )}

            {sheet && detalhe && (
                <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setSheet(false)}>
                    <div className="sheet">
                        <div className="sheet-handle" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="sheet-title">{detalhe.femea?.nome} × {detalhe.macho?.nome}</div>
                            <button className="btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red-bg)' }} onClick={excluir}>Excluir</button>
                        </div>

                        <div className="card" style={{ marginBottom: 14 }}>
                            <div className="info-row"><span>Gaiola</span><span>{detalhe.gaiolas?.numero || '—'}</span></div>
                            <div className="info-row"><span>Anel MC</span><span>{detalhe.anel_mc || '—'}</span></div>
                            <div className="info-row"><span>Anel FM</span><span>{detalhe.anel_fm || '—'}</span></div>
                            <div className="info-row"><span>Postura em</span><span>{fmt(detalhe.postura_em)}</span></div>
                            <div className="info-row"><span>Início choco</span><span>{fmt(detalhe.inicio_choco_em)}</span></div>
                            <div className="info-row"><span>Previsão nasc.</span><span style={{ color: 'var(--gold)' }}>{detalhe.inicio_choco_em ? fmt(addDias(detalhe.inicio_choco_em, 14)) : '—'}</span></div>
                            <div className="info-row"><span>Nascidos em</span><span>{fmt(detalhe.nascidos_em)}</span></div>
                            <div className="info-row"><span>Anéis FTS</span><span>{detalhe.anel_fts || '—'}</span></div>
                        </div>

                        <p className="section-title">Ovos</p>
                        {(detalhe.ovos || []).sort((a, b) => a.numero - b.numero).map(ovo => (
                            <div key={ovo.id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--muted)', flexShrink: 0 }}>
                                    {ovo.numero}
                                </div>
                                <select
                                    className="form-select"
                                    style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
                                    value={ovo.status}
                                    onChange={e => atualizarOvo(ovo.id, e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {STATUS_OVO.map(s => <option key={s}>{s}</option>)}
                                </select>
                                <span className={`badge ${BADGE_OVO[ovo.status]}`} style={{ flexShrink: 0 }}>
                  {ovo.status === 'Nascido' ? '🐣' : ovo.status === 'Fértil' ? '✓' : ovo.status === 'Infértil' ? '✗' : '○'}
                </span>
                            </div>
                        ))}

                        {detalhe.obs && (
                            <>
                                <p className="section-title">Observações</p>
                                <div className="card"><p style={{ fontSize: 13, color: 'var(--muted)' }}>{detalhe.obs}</p></div>
                            </>
                        )}

                        <button className="btn-ghost" style={{ width: '100%', marginTop: 8, padding: 12 }} onClick={() => { setDetalhe(null); setForm({ ...detalhe }); }}>
                            ✎ Editar dados da postura
                        </button>
                    </div>
                </div>
            )}

            {sheet && !detalhe && form.id && (
                // modo edição de postura existente — reutiliza o form de nova com dados preenchidos
                null
            )}
        </>
    )
}