import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const VAZIO = { numero: '', descricao: '', localizacao: '' }

export default function Gaiolas() {
    const [gaiolas, setGaiolas]   = useState([])
    const [sheet, setSheet]       = useState(false)
    const [detalhe, setDetalhe]   = useState(null)
    const [form, setForm]         = useState(VAZIO)
    const [loading, setLoading]   = useState(false)

    useEffect(() => { carregar() }, [])

    async function carregar() {
        const { data } = await supabase
            .from('gaiolas')
            .select('*, aves(id, nome, sexo, status)')
            .order('numero')
        setGaiolas(data || [])
    }

    function abrirNova() { setForm(VAZIO); setDetalhe(null); setSheet(true) }
    function abrirDetalhe(g) { setDetalhe(g); setForm({ numero: g.numero, descricao: g.descricao || '', localizacao: g.localizacao || '' }); setSheet(true) }
    function campo(k, v) { setForm(f => ({ ...f, [k]: v })) }

    async function salvar() {
        setLoading(true)
        if (detalhe) {
            await supabase.from('gaiolas').update(form).eq('id', detalhe.id)
        } else {
            await supabase.from('gaiolas').insert(form)
        }
        await carregar()
        setSheet(false)
        setLoading(false)
    }

    async function excluir() {
        if (!confirm(`Excluir gaiola ${detalhe.numero}?`)) return
        await supabase.from('gaiolas').delete().eq('id', detalhe.id)
        await carregar()
        setSheet(false)
    }

    return (
        <>
            <div className="top-bar">
                <div>
                    <h1>Gaiolas</h1>
                    <p>{gaiolas.length} cadastrada{gaiolas.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            <div className="page-content" style={{ paddingTop: 0 }}>
                {gaiolas.length === 0
                    ? <div className="empty"><i className="ti ti-home" /><p>Nenhuma gaiola cadastrada</p></div>
                    : gaiolas.map(g => {
                        const ativos = (g.aves || []).filter(a => a.status !== 'Vendido' && a.status !== 'Falecido')
                        return (
                            <div key={g.id} className="card" onClick={() => abrirDetalhe(g)} style={{ cursor: 'pointer' }}>
                                <div className="card-header">
                                    <div>
                                        <div className="card-title">Gaiola {g.numero}</div>
                                        <div className="card-sub">{g.localizacao || 'Sem localização'}</div>
                                    </div>
                                    <span className={`badge ${ativos.length > 0 ? 'badge-green' : 'badge-muted'}`}>
                    {ativos.length} ave{ativos.length !== 1 ? 's' : ''}
                  </span>
                                </div>
                                {ativos.length > 0 && (
                                    <>
                                        <div className="divider" />
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {ativos.map(a => (
                                                <span key={a.id} style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', padding: '3px 8px', borderRadius: 6 }}>
                          <i className={`ti ti-gender-${a.sexo === 'Macho' ? 'male' : 'female'}`} /> {a.nome}
                        </span>
                                            ))}
                                        </div>
                                    </>
                                )}
                                {g.descricao && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{g.descricao}</p>}
                            </div>
                        )
                    })
                }
            </div>

            <button className="fab" onClick={abrirNova}><i className="ti ti-plus" /></button>

            {sheet && (
                <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && setSheet(false)}>
                    <div className="sheet">
                        <div className="sheet-handle" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="sheet-title">{detalhe ? 'Editar gaiola' : 'Nova gaiola'}</div>
                            {detalhe && <button className="btn-ghost" style={{ color: 'var(--red)', borderColor: 'var(--red-bg)' }} onClick={excluir}>Excluir</button>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Número / Nome</label>
                            <input className="form-input" value={form.numero} onChange={e => campo('numero', e.target.value)} placeholder="Ex: 7 ou A-3" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Localização</label>
                            <input className="form-input" value={form.localizacao} onChange={e => campo('localizacao', e.target.value)} placeholder="Ex: Varanda, Quarto..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Descrição</label>
                            <textarea className="form-textarea" value={form.descricao} onChange={e => campo('descricao', e.target.value)} placeholder="Tamanho, material, observações..." />
                        </div>

                        {detalhe?.aves?.length > 0 && (
                            <>
                                <p className="section-title">Aves nesta gaiola</p>
                                {detalhe.aves.map(a => (
                                    <div key={a.id} className="info-row">
                                        <span>{a.nome}</span>
                                        <span className={`badge ${a.status === 'Ativo' ? 'badge-green' : 'badge-gold'}`}>{a.status}</span>
                                    </div>
                                ))}
                                <div className="divider" />
                            </>
                        )}

                        <button className="btn-primary" onClick={salvar} disabled={loading || !form.numero}>
                            {loading ? 'Salvando...' : detalhe ? 'Salvar alterações' : 'Cadastrar gaiola'}
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}