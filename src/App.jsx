// src/App.jsx — Versión Pro con roles, audit log, tags y responsables
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';
import { DndContext, closestCenter, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore, useRole } from './store/useStore';

// ============================================================
// COMPONENTE: Badge de rol
// ============================================================
function RoleBadge({ role }) {
  const colores = {
    admin:     { bg: '#ede9fe', text: '#5b21b6' },
    moderador: { bg: '#dbeafe', text: '#1e40af' },
    editor:    { bg: '#dcfce7', text: '#166534' },
    viewer:    { bg: '#f1f5f9', text: '#475569' },
  };
  const c = colores[role] || colores.viewer;
  return (
    <span style={{
      background: c.bg, color: c.text, fontSize: '11px',
      fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
      textTransform: 'uppercase', letterSpacing: '0.04em'
    }}>
      {role}
    </span>
  );
}

// ============================================================
// COMPONENTE: Tag chip
// ============================================================
function TagChip({ tag, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: tag.color + '22', color: tag.color,
      border: `1px solid ${tag.color}44`,
      fontSize: '11px', fontWeight: 600,
      padding: '2px 6px', borderRadius: '6px'
    }}>
      {tag.nombre}
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(tag.id); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: tag.color, padding: 0, lineHeight: 1 }}>
          ×
        </button>
      )}
    </span>
  );
}

// ============================================================
// COMPONENTE: Avatar de responsable
// ============================================================
function Avatar({ usuario, onRemove }) {
  const iniciales = (usuario.nombre || usuario.email || '?')
    .split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span title={usuario.nombre || usuario.email}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '24px', height: '24px', borderRadius: '50%',
        background: '#dbeafe', color: '#1e40af',
        fontSize: '10px', fontWeight: 700, cursor: onRemove ? 'pointer' : 'default',
        border: '1.5px solid white', marginLeft: '-4px'
      }}
      onClick={(e) => { e.stopPropagation(); onRemove && onRemove(usuario.id); }}>
      {iniciales}
    </span>
  );
}

// ============================================================
// COMPONENTE: Modal de detalle de tarea
// ============================================================
function TareaModal({ tarea, onClose }) {
  const { addTagATarea, removeTagDeTarea, asignarResponsable, quitarResponsable, tags, todosLosUsuarios, cargarUsuarios } = useStore();
  const { puedeEditar, puedeAsignar, puedeVerAudit } = useRole();
  const [nuevoTag, setNuevoTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showUserSelect, setShowUserSelect] = useState(false);

  useEffect(() => { cargarUsuarios(); }, []);

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!nuevoTag.trim()) return;
    await addTagATarea(tarea.id, nuevoTag.trim());
    setNuevoTag('');
    setShowTagInput(false);
  };

  const usuariosNoAsignados = todosLosUsuarios.filter(
    u => !(tarea.responsables || []).some(r => r.id === u.id)
  );

  const estadoColores = {
    idea: '#6366f1', progreso: '#f59e0b', revision: '#3b82f6', listo: '#10b981'
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '16px', padding: '28px',
        width: '100%', maxWidth: '560px', maxHeight: '85vh',
        overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{tarea.titulo}</h2>
            <span style={{
              display: 'inline-block', marginTop: '6px',
              background: estadoColores[tarea.estado] + '22',
              color: estadoColores[tarea.estado],
              fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '8px'
            }}>
              {tarea.estado.toUpperCase()}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: '8px',
            width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', color: '#64748b'
          }}>×</button>
        </div>

        {/* Descripción */}
        {tarea.descripcion && (
          <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
            {tarea.descripcion}
          </p>
        )}

        {/* Metadatos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {tarea.complejidad && (
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Complejidad</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{tarea.complejidad}</div>
            </div>
          )}
          {tarea.horas_estimadas && (
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Horas estimadas</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>{tarea.horas_estimadas}h</div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>ETIQUETAS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {(tarea.tags || []).map(tag => (
              <TagChip key={tag.id} tag={tag}
                onRemove={puedeEditar ? (tagId) => removeTagDeTarea(tarea.id, tagId) : null} />
            ))}
            {/* Sugerencias de tags anteriores */}
            {tags.filter(t => !(tarea.tags || []).some(tt => tt.id === t.id)).slice(0, 3).map(t => (
              <button key={t.id} onClick={() => addTagATarea(tarea.id, t.nombre, t.color)}
                style={{
                  background: 'white', border: `1px dashed ${t.color}`,
                  color: t.color, fontSize: '11px', padding: '2px 8px',
                  borderRadius: '6px', cursor: 'pointer', fontWeight: 600
                }}>
                + {t.nombre}
              </button>
            ))}
            {puedeEditar && !showTagInput && (
              <button onClick={() => setShowTagInput(true)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}>
                + Nueva
              </button>
            )}
            {showTagInput && (
              <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '4px' }}>
                <input value={nuevoTag} onChange={e => setNuevoTag(e.target.value)}
                  placeholder="nombre tag" autoFocus
                  style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', width: '100px' }} />
                <button type="submit" style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '12px' }}>OK</button>
              </form>
            )}
          </div>
        </div>

        {/* Responsables */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>RESPONSABLES</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', paddingLeft: '4px' }}>
              {(tarea.responsables || []).map(u => (
                <Avatar key={u.id} usuario={u}
                  onRemove={puedeAsignar ? (id) => quitarResponsable(tarea.id, id) : null} />
              ))}
            </div>
            {puedeAsignar && usuariosNoAsignados.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowUserSelect(!showUserSelect)}
                  style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  +
                </button>
                {showUserSelect && (
                  <div style={{
                    position: 'absolute', top: '30px', left: 0, background: 'white',
                    border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    minWidth: '180px', zIndex: 10, overflow: 'hidden'
                  }}>
                    {usuariosNoAsignados.map(u => (
                      <button key={u.id}
                        onClick={() => { asignarResponsable(tarea.id, u.id); setShowUserSelect(false); }}
                        style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Avatar usuario={u} />
                        <span>{u.nombre || u.email}</span>
                        <RoleBadge role={u.role} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Historial / Audit Log */}
        {puedeVerAudit && (tarea.historial || []).length > 0 && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>HISTORIAL</div>
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
              {(tarea.historial || []).map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '12px', color: '#475569', alignItems: 'baseline' }}>
                  <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(h.cuando).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>
                    <strong style={{ color: '#0f172a' }}>{h.accion}</strong>
                    {h.campo && <> · {h.campo}: </>}
                    {h.antes && <><span style={{ color: '#ef4444' }}>{h.antes}</span> → </>}
                    {h.despues && <span style={{ color: '#10b981' }}>{h.despues}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: Tarjeta de tarea (sortable)
// ============================================================
function SortableTask({ tarea, borrarTarea, onOpenModal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tarea.id });
  const { puedeEliminar } = useRole();
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="agenda-card"
      onClick={() => onOpenModal(tarea)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', flex: 1, paddingRight: '8px' }}>
          {tarea.titulo}
        </span>
        {puedeEliminar && (
          <button onClick={(e) => { e.stopPropagation(); borrarTarea(tarea.id); }}
            className="delete-btn" style={{ flexShrink: 0 }}>×</button>
        )}
      </div>

      {/* Tags */}
      {(tarea.tags || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
          {tarea.tags.slice(0, 3).map(tag => (
            <TagChip key={tag.id} tag={tag} />
          ))}
          {tarea.tags.length > 3 && (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>+{tarea.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Responsables y meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <div style={{ display: 'flex', paddingLeft: '4px' }}>
          {(tarea.responsables || []).slice(0, 4).map(u => (
            <Avatar key={u.id} usuario={u} />
          ))}
        </div>
        {tarea.complejidad && (
          <span style={{
            fontSize: '10px', color: '#94a3b8', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {tarea.complejidad}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: Columna Kanban
// ============================================================
function KanbanColumn({ estado, tareas, borrarTarea, onOpenModal }) {
  const { setNodeRef } = useDroppable({ id: estado });
  const { puedeModerarAListo } = useRole();

  const COLUMNAS = {
    idea:     { label: 'Ideas', color: '#6366f1', bg: '#eef2ff' },
    progreso: { label: 'En Progreso', color: '#f59e0b', bg: '#fffbeb' },
    revision: { label: 'En Revisión', color: '#3b82f6', bg: '#eff6ff' },
    listo:    { label: 'Aprobado', color: '#10b981', bg: '#f0fdf4' },
  };
  const col = COLUMNAS[estado] || { label: estado, color: '#64748b', bg: '#f8fafc' };

  return (
    <div ref={setNodeRef} style={{
      flex: 1, minWidth: '220px', background: col.bg,
      borderRadius: '12px', padding: '16px',
      border: `1px solid ${col.color}22`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {col.label}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            background: col.color + '22', color: col.color,
            fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px'
          }}>
            {tareas.length}
          </span>
          {estado === 'listo' && !puedeModerarAListo && (
            <span title="Solo moderadores pueden aprobar" style={{ fontSize: '14px', cursor: 'help' }}>🔒</span>
          )}
        </div>
      </div>

      <SortableContext items={tareas.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ minHeight: '60px' }}>
          {tareas.map(tarea => (
            <SortableTask key={tarea.id} tarea={tarea} borrarTarea={borrarTarea} onOpenModal={onOpenModal} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ============================================================
// COMPONENTE: Formulario para nueva tarea
// ============================================================
function NuevaTareaForm() {
  const { addTarea } = useStore();
  const { puedeCrear } = useRole();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [complejidad, setComplejidad] = useState('media');
  const [expandido, setExpandido] = useState(false);

  if (!puedeCrear) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    await addTarea(titulo, descripcion, complejidad);
    setTitulo('');
    setDescripcion('');
    setExpandido(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'white', borderRadius: '12px', padding: '16px',
      border: '1px solid #e2e8f0', marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          className="agenda-input"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          onFocus={() => setExpandido(true)}
          placeholder="Nueva tarea..."
          style={{ flex: 1 }}
        />
        <button className="agenda-btn" type="submit">+ AÑADIR</button>
      </div>

      {expandido && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            className="agenda-input"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Descripción (opcional)..."
            style={{ flex: 1, minWidth: '200px' }}
          />
          <select value={complejidad} onChange={e => setComplejidad(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', background: 'white', fontSize: '14px' }}>
            <option value="baja">Complejidad: Baja</option>
            <option value="media">Complejidad: Media</option>
            <option value="alta">Complejidad: Alta</option>
          </select>
        </div>
      )}
    </form>
  );
}

// ============================================================
// APP PRINCIPAL
// ============================================================
export default function App() {
  const { sesion, setSesion, perfil, cargarPerfil, tareas, cargarTareas, borrarTarea, moverTarea, tags, cargarTags } = useStore();
  const { role, esModerador } = useRole();
  const [tareaModal, setTareaModal] = useState(null);
  const [notificacion, setNotificacion] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSesion(session));
    supabase.auth.onAuthStateChange((_event, session) => setSesion(session));
  }, []);

  // Cargar datos cuando hay sesión
  useEffect(() => {
    if (sesion) {
      cargarPerfil(sesion.user.id);
      cargarTareas();
      cargarTags();
    }
  }, [sesion]);

  const mostrarNotificacion = (msg, tipo = 'info') => {
    setNotificacion({ msg, tipo });
    setTimeout(() => setNotificacion(null), 3000);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const COLUMNAS = ['idea', 'progreso', 'revision', 'listo'];
    const columnaDestino = COLUMNAS.includes(over.id)
      ? over.id
      : tareas.find(t => t.id === over.id)?.estado;
    if (!columnaDestino) return;
    const { error } = await moverTarea(active.id, columnaDestino);
    if (error) mostrarNotificacion(error, 'error');
  };

  if (!sesion) return <Login setSesion={setSesion} />;

  const COLUMNAS = ['idea', 'progreso', 'revision', 'listo'];

  return (
    <div className="dashboard-container">
      {/* Notificación */}
      {notificacion && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 200,
          background: notificacion.tipo === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${notificacion.tipo === 'error' ? '#fca5a5' : '#86efac'}`,
          color: notificacion.tipo === 'error' ? '#dc2626' : '#166534',
          padding: '12px 20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontSize: '14px', fontWeight: 500
        }}>
          {notificacion.msg}
        </div>
      )}

      {/* Header */}
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            CREADORES DASHBOARD
          </h1>
          {perfil && <RoleBadge role={perfil.role} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {perfil && (
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              {perfil.nombre || perfil.email}
            </span>
          )}
          <button className="agenda-btn" onClick={() => supabase.auth.signOut()}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Stats rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {COLUMNAS.map(col => {
          const conteo = tareas.filter(t => t.estado === col).length;
          const colores = { idea: '#6366f1', progreso: '#f59e0b', revision: '#3b82f6', listo: '#10b981' };
          const labels = { idea: 'Ideas', progreso: 'En Progreso', revision: 'En Revisión', listo: 'Aprobadas' };
          return (
            <div key={col} style={{
              background: 'white', borderRadius: '10px', padding: '16px',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              borderTop: `3px solid ${colores[col]}`
            }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                {labels[col]}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: colores[col] }}>{conteo}</div>
            </div>
          );
        })}
      </div>

      {/* Formulario nueva tarea */}
      <section>
        <NuevaTareaForm />

        {/* Kanban board */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            {COLUMNAS.map(estado => (
              <KanbanColumn
                key={estado}
                estado={estado}
                tareas={tareas.filter(t => t.estado === estado)}
                borrarTarea={borrarTarea}
                onOpenModal={setTareaModal}
              />
            ))}
          </div>
        </DndContext>

        {/* Nota de permisos para editors */}
        {!esModerador && (
          <div style={{
            marginTop: '16px', padding: '12px 16px',
            background: '#eff6ff', borderRadius: '8px',
            fontSize: '13px', color: '#3b82f6', border: '1px solid #bfdbfe'
          }}>
            ℹ️ Como <strong>{role}</strong>, podés mover tareas hasta "En Revisión".
            Un moderador deberá aprobarlas a "Aprobado".
          </div>
        )}
      </section>

      {/* Modal de detalle */}
      {tareaModal && (
        <TareaModal
          tarea={tareas.find(t => t.id === tareaModal.id) || tareaModal}
          onClose={() => setTareaModal(null)}
        />
      )}
    </div>
  );
}
