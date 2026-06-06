// src/App.jsx — Versión Final Compatible con tu Base de Datos
// Integra: proyectos múltiples, filtros, notificaciones realtime,
// canvas templates, admin panel, registro, audit log, roles y moderación.

import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';
import AdminPanel from './AdminPanel';
import CanvasBuilder from './CanvasBuilder';
import { DndContext, closestCenter, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore, useRole } from './store/useStore';

// ─────────────────────────────────────────────────────────────
// ÁTOMOS DE UI
// ─────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const C = { admin: ['#faf5ff','#7c3aed'], moderador: ['#eff6ff','#1d4ed8'], editor: ['#f0fdf4','#15803d'], viewer: ['#f8fafc','#475569'] };
  const [bg, text] = C[role] || C.viewer;
  return <span style={{ background: bg, color: text, fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{role}</span>;
}

function TagChip({ tag, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40`, fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '6px' }}>
      {tag.nombre || tag.name}
      {onRemove && <button onClick={e => { e.stopPropagation(); onRemove(tag.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tag.color, padding: 0, lineHeight: 1, fontSize: '13px' }}>×</button>}
    </span>
  );
}

function Avatar({ usuario, onRemove, size = 26 }) {
  const ini = (usuario.nombre || usuario.email || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span title={usuario.nombre || usuario.email}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: '50%', background: '#dbeafe', color: '#1e40af', fontSize: size * 0.38, fontWeight: 700, cursor: onRemove ? 'pointer' : 'default', border: '2px solid white', marginLeft: size === 26 ? '-4px' : 0 }}
      onClick={e => { e.stopPropagation(); onRemove?.(usuario.id); }}>
      {ini}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// CAMPANA DE NOTIFICACIONES
// ─────────────────────────────────────────────────────────────
function NotifBell() {
  const { notificaciones, notifNoLeidas, marcarTodasLeidas, marcarLeidaUna } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const TIPO_ICONO = { tarea_movida: '🔄', asignado: '👤', aprobado: '✅', comentario: '💬' };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ position: 'relative', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        🔔
        {notifNoLeidas > 0 && (
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 800, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {notifNoLeidas > 9 ? '9+' : notifNoLeidas}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: '44px', width: '340px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 300, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Notificaciones</span>
            {notifNoLeidas > 0 && (
              <button onClick={marcarTodasLeidas} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                Marcar todas leídas
              </button>
            )}
          </div>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notificaciones.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Sin notificaciones</div>
            ) : notificaciones.map(n => (
              <div key={n.id} onClick={() => marcarLeidaUna(n.id)}
                style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', background: n.leida ? 'white' : '#eff6ff', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{TIPO_ICONO[n.tipo] || '📌'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: n.leida ? 500 : 700, fontSize: '13px', color: '#0f172a' }}>{n.titulo}</div>
                  {n.mensaje && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{n.mensaje}</div>}
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                    {new Date(n.created_at).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!n.leida && <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', flexShrink: 0, marginTop: '4px' }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR DE PROYECTOS
// ─────────────────────────────────────────────────────────────
const COLORES_PROYECTO = ['#2563eb','#7c3aed','#db2777','#dc2626','#ea580c','#ca8a04','#16a34a','#0891b2','#475569'];
const ICONOS_PROYECTO = ['📋','🚀','💡','🎯','📱','🎨','📊','🔧','✍️','🎬','📸','🎵'];

function SidebarProyectos({ onCerrar }) {
  const { proyectos, proyectoActivo, seleccionarProyecto, crearProyecto, eliminarProyecto, actualizarProyecto } = useStore();
  const { esAdmin, esModerador } = useRole();
  const [creando, setCreando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', color: '#2563eb', icono: '📋' });

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    await crearProyecto(form);
    setForm({ nombre: '', descripcion: '', color: '#2563eb', icono: '📋' });
    setCreando(false);
  };

  return (
    <div style={{ width: '260px', background: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Proyectos
        </div>
        {proyectos.map(p => (
          <div key={p.id}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', background: proyectoActivo?.id === p.id ? '#1e293b' : 'transparent' }}
            onClick={() => { seleccionarProyecto(p); onCerrar?.(); }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{p.icono || '📋'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: proyectoActivo?.id === p.id ? 700 : 500, color: proyectoActivo?.id === p.id ? 'white' : '#94a3b8' }}>
                {p.nombre}
              </div>
            </div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color || '#2563eb', flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {(esModerador || esAdmin) && (
        <div style={{ padding: '12px 16px' }}>
          {!creando ? (
            <button onClick={() => setCreando(true)} style={{ width: '100%', background: '#1e293b', border: '1px dashed #334155', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
              + Nuevo proyecto
            </button>
          ) : (
            <form onSubmit={handleCrear} style={{ background: '#1e293b', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Nombre del proyecto" autoFocus
                style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '7px 10px', color: 'white', fontSize: '13px', width: '100%' }} />
              <input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Descripción (opcional)"
                style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '7px 10px', color: 'white', fontSize: '13px', width: '100%' }} />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {ICONOS_PROYECTO.map(ic => (
                  <button key={ic} type="button" onClick={() => setForm({...form, icono: ic})}
                    style={{ background: form.icono === ic ? '#334155' : 'transparent', border: 'none', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer', fontSize: '16px' }}>
                    {ic}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {COLORES_PROYECTO.map(c => (
                  <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                    style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: form.color === c ? '2px solid white' : 'none', cursor: 'pointer' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="submit" style={{ flex: 1, background: '#2563eb', border: 'none', borderRadius: '6px', padding: '7px', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Crear</button>
                <button type="button" onClick={() => setCreando(false)} style={{ background: '#334155', border: 'none', borderRadius: '6px', padding: '7px 10px', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}>×</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div style={{ flex: 1 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BARRA DE FILTROS
// ─────────────────────────────────────────────────────────────
function BarraFiltros() {
  const { filtros, setFiltro, limpiarFiltros, tags, todosLosUsuarios } = useStore();
  const hayFiltros = filtros.busqueda || filtros.estado !== 'todos' || filtros.complejidad !== 'todos' || filtros.tag !== 'todos' || filtros.responsable !== 'todos';

  const selectStyle = { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 10px', background: 'white', fontSize: '13px', color: '#475569', cursor: 'pointer', fontFamily: 'inherit' };

  return (
    <div style={{ background: 'white', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        value={filtros.busqueda}
        onChange={e => setFiltro('busqueda', e.target.value)}
        placeholder="🔍 Buscar tareas..."
        className="agenda-input"
        style={{ flex: 1, minWidth: '160px' }}
      />
      <select value={filtros.estado} onChange={e => setFiltro('estado', e.target.value)} style={selectStyle}>
        <option value="todos">Estado: Todos</option>
        <option value="idea">Ideas</option>
        <option value="progreso">En Progreso</option>
        <option value="revision">En Revisión</option>
        <option value="listo">Aprobado</option>
      </select>
      <select value={filtros.complejidad} onChange={e => setFiltro('complejidad', e.target.value)} style={selectStyle}>
        <option value="todos">Complejidad: Todas</option>
        <option value="baja">Baja</option>
        <option value="media">Media</option>
        <option value="alta">Alta</option>
      </select>
      {tags.length > 0 && (
        <select value={filtros.tag} onChange={e => setFiltro('tag', e.target.value)} style={selectStyle}>
          <option value="todos">Tag: Todos</option>
          {tags.map(t => <option key={t.id} value={t.id}>{t.nombre || t.name}</option>)}
        </select>
      )}
      {todosLosUsuarios.length > 0 && (
        <select value={filtros.responsable} onChange={e => setFiltro('responsable', e.target.value)} style={selectStyle}>
          <option value="todos">Responsable: Todos</option>
          {todosLosUsuarios.map(u => <option key={u.id} value={u.id}>{u.nombre || u.email}</option>)}
        </select>
      )}
      {hayFiltros && (
        <button onClick={limpiarFiltros} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
          ✕ Limpiar
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL DE TAREA (detalle + edición inline)
// ─────────────────────────────────────────────────────────────
function TareaModal({ tarea, onClose }) {
  const { addTagATarea, removeTagDeTarea, asignarResponsable, quitarResponsable, editarTarea, tags, todosLosUsuarios, cargarUsuarios, guardarCampoTarea } = useStore();
  const { puedeEditar, puedeAsignar, puedeVerAudit } = useRole();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ titulo: tarea.titulo, descripcion: tarea.descripcion || '', complejidad: tarea.complejidad || 'media', horas_estimadas: tarea.horas_estimadas || '' });
  const [nuevoTag, setNuevoTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargarUsuarios(); }, []);
  useEffect(() => {
    setForm({ titulo: tarea.titulo, descripcion: tarea.descripcion || '', complejidad: tarea.complejidad || 'media', horas_estimadas: tarea.horas_estimadas || '' });
  }, [tarea]);

  const handleGuardar = async () => {
    setGuardando(true);
    await editarTarea(tarea.id, {
      titulo: form.titulo,
      descripcion: form.descripcion,
      complejidad: form.complejidad,
      horas_estimadas: form.horas_estimadas ? parseInt(form.horas_estimadas) : null
    });
    setGuardando(false);
    setEditMode(false);
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!nuevoTag.trim()) return;
    await addTagATarea(tarea.id, nuevoTag.trim());
    setNuevoTag(''); setShowTagInput(false);
  };

  const usuariosNoAsignados = todosLosUsuarios.filter(u => !(tarea.responsables || []).some(r => r.id === u.id));
  const COL = { idea: '#6366f1', progreso: '#f59e0b', revision: '#3b82f6', listo: '#10b981' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>

        <div style={{ padding: '22px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: '12px' }}>
            {editMode ? (
              <input value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})}
                style={{ width: '100%', fontSize: '20px', fontWeight: 700, border: '2px solid #93c5fd', borderRadius: '8px', padding: '6px 10px', fontFamily: 'inherit' }} autoFocus />
            ) : (
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{tarea.titulo}</h2>
            )}
            <span style={{ display: 'inline-block', marginTop: '8px', background: (COL[tarea.estado] || '#64748b') + '20', color: COL[tarea.estado] || '#64748b', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px' }}>
              {tarea.estado?.toUpperCase() || 'IDEA'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {puedeEditar && !editMode && (
              <button onClick={() => setEditMode(true)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                ✏️ Editar
              </button>
            )}
            {editMode && (
              <>
                <button onClick={handleGuardar} disabled={guardando} style={{ background: '#2563eb', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'white' }}>
                  {guardando ? '...' : '💾 Guardar'}
                </button>
                <button onClick={() => setEditMode(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}>
                  Cancelar
                </button>
              </>
            )}
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>×</button>
          </div>
        </div>

        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Descripción</div>
            {editMode ? (
              <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                rows={3} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
            ) : (
              <p style={{ margin: 0, color: tarea.descripcion ? '#475569' : '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
                {tarea.descripcion || 'Sin descripción.'}
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Complejidad</div>
              {editMode ? (
                <select value={form.complejidad} onChange={e => setForm({...form, complejidad: e.target.value})}
                  style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', fontSize: '13px', background: 'white', width: '100%' }}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              ) : (
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{tarea.complejidad || '—'}</div>
              )}
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Horas estimadas</div>
              {editMode ? (
                <input type="number" value={form.horas_estimadas} onChange={e => setForm({...form, horas_estimadas: e.target.value})}
                  placeholder="0" min="0"
                  style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', fontSize: '13px', background: 'white', width: '100%' }} />
              ) : (
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{tarea.horas_estimadas ? `${tarea.horas_estimadas}h` : '—'}</div>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Etiquetas</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {(tarea.tags || []).map(tag => (
                <TagChip key={tag.id} tag={tag} onRemove={puedeEditar ? id => removeTagDeTarea(tarea.id, id) : null} />
              ))}
              {tags.filter(t => !(tarea.tags || []).some(tt => tt.id === t.id)).slice(0, 4).map(t => (
                <button key={t.id} onClick={() => addTagATarea(tarea.id, t.nombre || t.name, t.color)}
                  style={{ background: 'white', border: `1px dashed ${t.color}`, color: t.color, fontSize: '11px', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                  + {t.nombre || t.name}
                </button>
              ))}
              {puedeEditar && !showTagInput && (
                <button onClick={() => setShowTagInput(true)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}>+ Nueva</button>
              )}
              {showTagInput && (
                <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '4px' }}>
                  <input value={nuevoTag} onChange={e => setNuevoTag(e.target.value)} placeholder="nombre" autoFocus
                    style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', width: '90px' }} />
                  <button type="submit" style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '12px' }}>OK</button>
                </form>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Responsables</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', paddingLeft: '4px' }}>
                {(tarea.responsables || []).map(u => (
                  <Avatar key={u.id} usuario={u} onRemove={puedeAsignar ? id => quitarResponsable(tarea.id, id) : null} />
                ))}
              </div>
              {puedeAsignar && usuariosNoAsignados.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowUserSelect(!showUserSelect)}
                    style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    +
                  </button>
                  {showUserSelect && (
                    <div style={{ position: 'absolute', top: '32px', left: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: '200px', zIndex: 10, overflow: 'hidden' }}>
                      {usuariosNoAsignados.map(u => (
                        <button key={u.id} onClick={() => { asignarResponsable(tarea.id, u.id); setShowUserSelect(false); }}
                          style={{ width: '100%', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Avatar usuario={u} />
                          <span style={{ flex: 1 }}>{u.nombre || u.email}</span>
                          <RoleBadge role={u.role} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {puedeVerAudit && (tarea.historial || []).length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Historial de cambios</div>
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(tarea.historial || []).map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#475569', alignItems: 'baseline' }}>
                    <span style={{ color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {new Date(h.cuando).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>
                      <strong style={{ color: '#0f172a' }}>{h.accion}</strong>
                      {h.campo && <span style={{ color: '#64748b' }}> · {h.campo}: </span>}
                      {h.antes && <><span style={{ color: '#ef4444' }}>{h.antes}</span> → </>}
                      {h.despues && <span style={{ color: '#10b981', fontWeight: 600 }}>{h.despues}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TARJETA SORTABLE
// ─────────────────────────────────────────────────────────────
function SortableTask({ tarea, borrarTarea, onOpenModal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tarea.id });
  const { puedeEliminar } = useRole();

  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, touchAction: 'none', opacity: isDragging ? 0.4 : 1 }}
      {...attributes} {...listeners}
      className="agenda-card"
      onClick={() => onOpenModal(tarea)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', flex: 1, paddingRight: '6px', lineHeight: 1.4 }}>{tarea.titulo}</span>
        {puedeEliminar && (
          <button onClick={e => { e.stopPropagation(); borrarTarea(tarea.id); }} className="delete-btn">×</button>
        )}
      </div>
      {(tarea.tags || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '7px' }}>
          {tarea.tags.slice(0, 3).map(tag => <TagChip key={tag.id} tag={tag} />)}
          {tarea.tags.length > 3 && <span style={{ fontSize: '10px', color: '#94a3b8' }}>+{tarea.tags.length - 3}</span>}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <div style={{ display: 'flex', paddingLeft: '4px' }}>
          {(tarea.responsables || []).slice(0, 4).map(u => <Avatar key={u.id} usuario={u} />)}
        </div>
        {tarea.complejidad && (
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {tarea.complejidad}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COLUMNA KANBAN
// ─────────────────────────────────────────────────────────────
function KanbanColumn({ estado, tareas, borrarTarea, onOpenModal, configColumna }) {
  const { setNodeRef } = useDroppable({ id: estado });
  const { puedeModerarAListo } = useRole();
  const DEF = { idea: { label: 'Ideas', color: '#6366f1', bg: '#eef2ff' }, progreso: { label: 'En Progreso', color: '#f59e0b', bg: '#fffbeb' }, revision: { label: 'En Revisión', color: '#3b82f6', bg: '#eff6ff' }, listo: { label: 'Aprobado', color: '#10b981', bg: '#f0fdf4' } };
  const col = configColumna || DEF[estado] || { label: estado, color: '#64748b', bg: '#f8fafc' };

  return (
    <div ref={setNodeRef} style={{ flex: 1, minWidth: '200px', background: col.bg || col.color + '12', borderRadius: '12px', padding: '14px', border: `1px solid ${col.color}25` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: col.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{col.label}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ background: col.color + '22', color: col.color, fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '20px' }}>{tareas.length}</span>
          {estado === 'listo' && !puedeModerarAListo && <span title="Solo moderadores pueden aprobar" style={{ fontSize: '12px' }}>🔒</span>}
        </div>
      </div>
      <SortableContext items={tareas.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ minHeight: '50px' }}>
          {tareas.map(tarea => <SortableTask key={tarea.id} tarea={tarea} borrarTarea={borrarTarea} onOpenModal={onOpenModal} />)}
        </div>
      </SortableContext>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FORM NUEVA TAREA
// ─────────────────────────────────────────────────────────────
function NuevaTareaForm() {
  const { addTarea } = useStore();
  const { puedeCrear } = useRole();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [complejidad, setComplejidad] = useState('media');
  const [horas, setHoras] = useState('');
  const [expandido, setExpandido] = useState(false);

  if (!puedeCrear) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    await addTarea({ titulo, descripcion, complejidad, horas_estimadas: horas ? parseInt(horas) : null });
    setTitulo(''); setDescripcion(''); setHoras(''); setExpandido(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input className="agenda-input" value={titulo} onChange={e => setTitulo(e.target.value)}
          onFocus={() => setExpandido(true)} placeholder="Nueva tarea..." style={{ flex: 1 }} />
        <button className="agenda-btn" type="submit">+ Añadir</button>
      </div>
      {expandido && (
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input className="agenda-input" value={descripcion} onChange={e => setDescripcion(e.target.value)}
            placeholder="Descripción..." style={{ flex: 2, minWidth: '180px' }} />
          <select value={complejidad} onChange={e => setComplejidad(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', background: 'white', fontSize: '13px', fontFamily: 'inherit' }}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
          <input type="number" className="agenda-input" value={horas} onChange={e => setHoras(e.target.value)}
            placeholder="Horas est." min="0" style={{ width: '110px' }} />
        </div>
      )}
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function App() {
  const {
    sesion, setSesion, perfil, cargarPerfil,
    proyectos, proyectoActivo, cargarProyectos,
    tareas, cargarTareas, borrarTarea, moverTarea,
    cargarTags, cargarUsuarios,
    cargarNotificaciones, suscribirNotificaciones,
    cargarTemplates, templates,
    filtros
  } = useStore();

  const { role, esModerador, esAdmin, puedeGestionarTemplates } = useRole();
  const [tareaModal, setTareaModal] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [notifToast, setNotifToast] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSesion(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSesion(session));
    return () => subscription.unsubscribe();
  }, []);

  // Cargar todo al loguear
  useEffect(() => {
    if (sesion) {
      cargarPerfil(sesion.user.id);
      cargarProyectos();
      cargarTags();
      cargarUsuarios();
      cargarNotificaciones();
      cargarTemplates();
      const unsub = suscribirNotificaciones();
      return unsub;
    }
  }, [sesion]);

  // Toast de notificaciones nuevas
  const notifCount = useStore(s => s.notifNoLeidas);
  const prevCount = useRef(0);
  useEffect(() => {
    if (notifCount > prevCount.current && prevCount.current !== 0) {
      setNotifToast('Nueva notificación');
      setTimeout(() => setNotifToast(null), 3000);
    }
    prevCount.current = notifCount;
  }, [notifCount]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const COLS = ['idea', 'progreso', 'revision', 'listo'];
    const dest = COLS.includes(over.id) ? over.id : tareas.find(t => t.id === over.id)?.estado;
    if (!dest) return;
    const { error } = await moverTarea(active.id, dest);
    if (error) setNotifToast(error);
  };

  if (!sesion) return <Login setSesion={setSesion} />;

  const columnas = [
    { id: 'idea', label: 'Ideas', color: '#6366f1' },
    { id: 'progreso', label: 'En Progreso', color: '#f59e0b' },
    { id: 'revision', label: 'En Revisión', color: '#3b82f6' },
    { id: 'listo', label: 'Aprobado', color: '#10b981' },
  ];

  const { tareasFiltradas } = useStore.getState();
  const hayFiltros = filtros.busqueda || filtros.estado !== 'todos' || filtros.complejidad !== 'todos' || filtros.tag !== 'todos' || filtros.responsable !== 'todos';
  const tareasAMostrar = hayFiltros ? tareasFiltradas : tareas;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      {showSidebar && <SidebarProyectos onCerrar={null} />}

      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>

          {notifToast && (
            <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 500, background: '#0f172a', color: 'white', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              {notifToast}
            </div>
          )}

          <header className="dashboard-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => setShowSidebar(!showSidebar)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b', padding: '4px' }}>
                ☰
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                  {proyectoActivo ? (
                    <><span style={{ marginRight: '8px' }}>{proyectoActivo.icono || '📋'}</span>{proyectoActivo.nombre}</>
                  ) : 'Creadores Dashboard'}
                </h1>
                {proyectoActivo?.descripcion && (
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{proyectoActivo.descripcion}</p>
                )}
              </div>
              {perfil && <RoleBadge role={perfil.role} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <NotifBell />
              {puedeGestionarTemplates && (
                <button onClick={() => setShowCanvas(true)}
                  style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  🎨 Canvas
                </button>
              )}
              {esAdmin && (
                <button onClick={() => setShowAdmin(true)}
                  style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  ⚙️ Admin
                </button>
              )}
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>{perfil?.nombre || perfil?.email}</span>
              <button className="agenda-btn" onClick={() => supabase.auth.signOut()} style={{ padding: '8px 14px' }}>
                Salir
              </button>
            </div>
          </header>

          {!proyectoActivo && proyectos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <h2 style={{ color: '#0f172a', marginBottom: '8px' }}>Sin proyectos aún</h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                {esModerador ? 'Creá tu primer proyecto desde el panel izquierdo.' : 'Pedile a un moderador que te invite a un proyecto.'}
              </p>
            </div>
          )}

          {proyectoActivo && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {columnas.map(col => {
                  const n = tareas.filter(t => t.estado === col.id).length;
                  return (
                    <div key={col.id} style={{ background: 'white', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0', borderTop: `3px solid ${col.color}` }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{col.label}</div>
                      <div style={{ fontSize: '26px', fontWeight: 800, color: col.color }}>{n}</div>
                    </div>
                  );
                })}
              </div>

              <BarraFiltros />
              <NuevaTareaForm />

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {columnas.map(col => (
                    <KanbanColumn
                      key={col.id}
                      estado={col.id}
                      tareas={tareasAMostrar.filter(t => t.estado === col.id)}
                      borrarTarea={borrarTarea}
                      onOpenModal={setTareaModal}
                      configColumna={col}
                    />
                  ))}
                </div>
              </DndContext>

              {hayFiltros && tareasAMostrar.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                  No hay tareas que coincidan con los filtros.
                </div>
              )}

              {!esModerador && (
                <div style={{ marginTop: '14px', padding: '10px 14px', background: '#eff6ff', borderRadius: '8px', fontSize: '12px', color: '#3b82f6', border: '1px solid #bfdbfe' }}>
                  ℹ️ Como <strong>{role}</strong>, podés mover tareas hasta "En Revisión". Un moderador debe aprobar a "Aprobado".
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {tareaModal && (
        <TareaModal
          tarea={tareas.find(t => t.id === tareaModal.id) || tareaModal}
          onClose={() => setTareaModal(null)}
        />
      )}
      {showAdmin && <AdminPanel onCerrar={() => setShowAdmin(false)} proyectos={proyectos} />}
      {showCanvas && <CanvasBuilder onCerrar={() => setShowCanvas(false)} />}
    </div>
  );
}