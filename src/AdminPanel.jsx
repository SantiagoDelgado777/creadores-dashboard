// src/AdminPanel.jsx — Panel de administración completo
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useStore } from './store/useStore';

const ROLES = ['admin', 'moderador', 'editor', 'viewer'];
const ROL_C = {
  admin:     ['#faf5ff','#7c3aed','#ddd6fe'],
  moderador: ['#eff6ff','#1d4ed8','#bfdbfe'],
  editor:    ['#f0fdf4','#065f46','#a7f3d0'],
  viewer:    ['#f8fafc','#475569','#e2e8f0'],
};
const ROL_DESC = {
  admin:     'Acceso total. Gestiona roles, elimina cualquier contenido, ve audit log.',
  moderador: 'Aprueba tareas, invita miembros, ve audit log. No puede cambiar roles.',
  editor:    'Crea y mueve tareas hasta "En Revisión". Puede asignar responsables.',
  viewer:    'Solo lectura. No puede crear ni modificar nada.',
};

function RoleBadge({ role }) {
  const c = ROL_C[role] || ROL_C.viewer;
  return <span style={{ background: c[0], color: c[1], border: `1px solid ${c[2]}`, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{role}</span>;
}

// ── TAB USUARIOS ────────────────────────────────
function TabUsuarios({ perfilActual }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [nuevoRol, setNuevoRol] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setUsuarios(data); setCargando(false); });
  }, []);

  const cambiarRol = async (userId) => {
    if (!nuevoRol) return;
    await supabase.from('profiles').update({ role: nuevoRol }).eq('id', userId);
    setUsuarios(u => u.map(x => x.id === userId ? { ...x, role: nuevoRol } : x));
    setEditandoId(null);
  };

  const filtrados = usuarios.filter(u =>
    (u.nombre || u.email || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) return <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700 }}>Usuarios registrados</h3>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{usuarios.length} usuarios en total</p>
        </div>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar..." className="agenda-input" style={{ width: 200 }} />
      </div>

      {/* Guía de roles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 20 }}>
        {ROLES.map(r => (
          <div key={r} style={{ background: ROL_C[r][0], border: `1px solid ${ROL_C[r][2]}`, borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <RoleBadge role={r} />
            <span style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{ROL_DESC[r]}</span>
          </div>
        ))}
      </div>

      {filtrados.map(u => (
        <div key={u.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
            {(u.nombre || u.email || '?').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
              {u.nombre || '(sin nombre)'}
              {u.id === perfilActual?.id && <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 8, fontWeight: 400 }}>Tú</span>}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{u.email}</div>
          </div>
          {editandoId === u.id ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select value={nuevoRol} onChange={e => setNuevoRol(e.target.value)}
                style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 10px', fontSize: 12, background: 'white', fontFamily: 'inherit' }}>
                <option value="">Elegir rol...</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => cambiarRol(u.id)} className="agenda-btn" style={{ padding: '6px 12px', fontSize: 12 }}>OK</button>
              <button onClick={() => setEditandoId(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: '#64748b', fontFamily: 'inherit' }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <RoleBadge role={u.role} />
              {u.id !== perfilActual?.id && (
                <button onClick={() => { setEditandoId(u.id); setNuevoRol(u.role); }}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: '#64748b', fontFamily: 'inherit', fontWeight: 600 }}>
                  Cambiar
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── TAB MIEMBROS DE PROYECTO ────────────────────
function TabMiembros({ proyectos, perfilActual }) {
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id || null);
  const [miembros, setMiembros] = useState([]);
  const [todosUsers, setTodosUsers] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => { if (data) setTodosUsers(data); });
  }, []);

  useEffect(() => {
    if (!proyectoId) return;
    setCargando(true);
    supabase.from('project_members')
      .select('*, profiles:user_id(id, nombre, email, role)')
      .eq('project_id', proyectoId)
      .then(({ data }) => { if (data) setMiembros(data); setCargando(false); });
  }, [proyectoId]);

  const invitar = async (userId) => {
    const { data } = await supabase.from('project_members')
      .insert([{ project_id: proyectoId, user_id: userId, invited_by: perfilActual.id }])
      .select('*, profiles:user_id(id, nombre, email, role)').single();
    if (data) setMiembros(m => [...m, data]);
  };

  const cambiarRol = async (memberId, rol) => {
    await supabase.from('project_members').update({ role: rol }).eq('id', memberId);
    setMiembros(m => m.map(x => x.id === memberId ? { ...x, role: rol } : x));
  };

  const remover = async (memberId) => {
    await supabase.from('project_members').delete().eq('id', memberId);
    setMiembros(m => m.filter(x => x.id !== memberId));
  };

  const noMiembros = todosUsers.filter(u => !miembros.some(m => m.user_id === u.id));

  return (
    <div>
      <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Miembros por proyecto</h3>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 20 }}>
        {proyectos.map(p => (
          <button key={p.id} onClick={() => setProyectoId(p.id)}
            style={{ padding: '6px 14px', borderRadius: 8, cursor: 'pointer', border: proyectoId === p.id ? `2px solid ${p.color || '#2563eb'}` : '1px solid #e2e8f0', background: proyectoId === p.id ? (p.color || '#2563eb') + '15' : 'white', color: proyectoId === p.id ? (p.color || '#2563eb') : '#64748b', fontWeight: proyectoId === p.id ? 700 : 400, fontSize: 12, fontFamily: 'inherit' }}>
            {p.icono} {p.nombre}
          </button>
        ))}
      </div>

      {!proyectoId ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>Seleccioná un proyecto</div>
      ) : cargando ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 32 }}>Cargando...</div>
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>MIEMBROS ACTUALES ({miembros.length})</div>
          {miembros.map(m => (
            <div key={m.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                {(m.profiles?.nombre || m.profiles?.email || '?').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.profiles?.nombre || m.profiles?.email}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Rol global: {m.profiles?.role}</div>
              </div>
              <select value={m.role} onChange={e => cambiarRol(m.id, e.target.value)}
                style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '4px 8px', fontSize: 12, background: 'white', fontFamily: 'inherit' }}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => remover(m.id)}
                style={{ background: '#fef2f2', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: '#dc2626', fontFamily: 'inherit', fontWeight: 600 }}>
                Quitar
              </button>
            </div>
          ))}
          {noMiembros.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: '14px 0 8px' }}>INVITAR AL PROYECTO</div>
              {noMiembros.map(u => (
                <div key={u.id} style={{ background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                    {(u.nombre || u.email || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: '#475569' }}>{u.nombre || u.email}</div>
                    <RoleBadge role={u.role} />
                  </div>
                  <button onClick={() => invitar(u.id)} className="agenda-btn" style={{ padding: '6px 12px', fontSize: 12 }}>+ Invitar</button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── TAB AUDIT LOG ───────────────────────────────
function TabAudit() {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.from('audit_log')
      .select('*, profiles:user_id(nombre, email)')
      .order('timestamp', { ascending: false })
      .limit(100)
      .then(({ data }) => { if (data) setLogs(data); setCargando(false); });
  }, []);

  const ACCION_C = { moved: '#3b82f6', updated: '#f59e0b', created: '#10b981', deleted: '#ef4444', assigned: '#8b5cf6' };

  if (cargando) return <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Cargando historial...</div>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700 }}>Historial global de cambios</h3>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Últimos {logs.length} eventos registrados automáticamente</p>
      </div>
      {logs.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Sin eventos todavía.</div>}
      {logs.map(log => (
        <div key={log.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 14px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 5 }}>
          <span style={{ background: (ACCION_C[log.action] || '#64748b') + '18', color: ACCION_C[log.action] || '#64748b', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0 }}>
            {log.action}
          </span>
          <div style={{ flex: 1, fontSize: 12, color: '#0f172a' }}>
            {log.campo_cambiado && <span style={{ color: '#64748b' }}>{log.campo_cambiado}: </span>}
            {log.valor_anterior && <><span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{log.valor_anterior}</span> → </>}
            {log.valor_nuevo && <span style={{ color: '#10b981', fontWeight: 600 }}>{log.valor_nuevo}</span>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>{log.profiles?.nombre || log.profiles?.email || 'Sistema'}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              {new Date(log.timestamp).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ADMIN PANEL PRINCIPAL ───────────────────────
export default function AdminPanel({ onCerrar, proyectos }) {
  const { perfil } = useStore();
  const [tab, setTab] = useState('usuarios');

  const TABS = [
    { id: 'usuarios',  label: '👥 Usuarios y roles' },
    { id: 'miembros',  label: '🏗️ Miembros de proyecto' },
    { id: 'audit',     label: '📋 Audit log' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 250, padding: 20 }}>
      <div style={{ background: '#f8fafc', borderRadius: 18, width: '100%', maxWidth: 760, maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
        <div style={{ background: 'white', padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Panel de Administración</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Usuarios, roles, miembros de proyecto y trazabilidad</p>
          </div>
          <button onClick={onCerrar}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 18, color: '#64748b' }}>×</button>
        </div>
        <div style={{ background: 'white', padding: '0 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 14px', fontSize: 12, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#2563eb' : '#64748b', borderBottom: tab === t.id ? '2px solid #2563eb' : '2px solid transparent', fontFamily: 'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {tab === 'usuarios' && <TabUsuarios perfilActual={perfil} />}
          {tab === 'miembros' && <TabMiembros proyectos={proyectos} perfilActual={perfil} />}
          {tab === 'audit' && <TabAudit />}
        </div>
      </div>
    </div>
  );
}