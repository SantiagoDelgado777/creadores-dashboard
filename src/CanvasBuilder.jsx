// src/CanvasBuilder.jsx
// Constructor visual de plantillas de proyectos (Canvas)
// Solo accesible para admin y moderador

import { useState } from 'react';
import { useStore } from './store/useStore';

const TIPOS_CAMPO = [
  { id: 'texto', label: '📝 Texto libre' },
  { id: 'select', label: '📋 Lista de opciones' },
  { id: 'fecha', label: '📅 Fecha' },
  { id: 'numero', label: '🔢 Número' },
];

const COLORES_COLUMNA = ['#6366f1','#f59e0b','#3b82f6','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

function CampoEditor({ campo, onChange, onEliminar }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select value={campo.tipo} onChange={e => onChange({ ...campo, tipo: e.target.value })}
          style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 8px', fontSize: '12px', background: 'white' }}>
          {TIPOS_CAMPO.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <input value={campo.label} onChange={e => onChange({ ...campo, label: e.target.value })}
          placeholder="Nombre del campo"
          style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', fontSize: '12px' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
          <input type="checkbox" checked={campo.requerido || false} onChange={e => onChange({ ...campo, requerido: e.target.checked })} />
          Req.
        </label>
        <button onClick={onEliminar} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>×</button>
      </div>
      {campo.tipo === 'select' && (
        <div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Opciones (separadas por coma)</div>
          <input
            value={(campo.opciones || []).join(', ')}
            onChange={e => onChange({ ...campo, opciones: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })}
            placeholder="opción 1, opción 2, opción 3"
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', fontSize: '12px' }} />
        </div>
      )}
    </div>
  );
}

function ColumnaEditor({ columna, onChange, onEliminar }) {
  return (
    <div style={{ background: columna.color + '12', border: `1px solid ${columna.color}40`, borderRadius: '10px', padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input value={columna.label} onChange={e => onChange({ ...columna, label: e.target.value })}
        style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', fontWeight: 600 }} />
      <input value={columna.id} onChange={e => onChange({ ...columna, id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
        placeholder="id_columna"
        style={{ width: '110px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', color: '#64748b' }} />
      <div style={{ display: 'flex', gap: '3px' }}>
        {COLORES_COLUMNA.map(c => (
          <button key={c} type="button" onClick={() => onChange({ ...columna, color: c })}
            style={{ width: '18px', height: '18px', borderRadius: '50%', background: c, border: columna.color === c ? '2px solid #0f172a' : 'none', cursor: 'pointer' }} />
        ))}
      </div>
      <button onClick={onEliminar} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>×</button>
    </div>
  );
}

export default function CanvasBuilder({ onCerrar }) {
  const { templates, templateActivo, crearTemplate, actualizarTemplate, eliminarTemplate, aplicarTemplateAProyecto, proyectos, proyectoActivo } = useStore();

  const TEMPLATE_VACIO = {
    columnas: [
      { id: 'idea', label: 'Ideas', color: '#6366f1' },
      { id: 'progreso', label: 'En Progreso', color: '#f59e0b' },
      { id: 'revision', label: 'En Revisión', color: '#3b82f6' },
      { id: 'listo', label: 'Aprobado', color: '#10b981' },
    ],
    campos: [
      { id: 'titulo', label: 'Título', tipo: 'texto', requerido: true },
      { id: 'descripcion', label: 'Descripción', tipo: 'texto', requerido: false },
      { id: 'complejidad', label: 'Complejidad', tipo: 'select', opciones: ['baja', 'media', 'alta'], requerido: false },
      { id: 'horas_estimadas', label: 'Horas estimadas', tipo: 'numero', requerido: false },
    ]
  };

  const [tab, setTab] = useState('lista'); // 'lista' | 'editor'
  const [editando, setEditando] = useState(null); // template en edición
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [esPublica, setEsPublica] = useState(false);
  const [config, setConfig] = useState(TEMPLATE_VACIO);
  const [guardando, setGuardando] = useState(false);

  const iniciarNuevo = () => {
    setEditando(null);
    setNombre('');
    setDescripcion('');
    setEsPublica(false);
    setConfig(JSON.parse(JSON.stringify(TEMPLATE_VACIO)));
    setTab('editor');
  };

  const cargarTemplate = (t) => {
    setEditando(t);
    setNombre(t.nombre);
    setDescripcion(t.descripcion || '');
    setEsPublica(t.es_publica);
    setConfig(JSON.parse(JSON.stringify(t.config)));
    setTab('editor');
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    if (editando) {
      await actualizarTemplate(editando.id, { nombre, descripcion, config, es_publica: esPublica });
    } else {
      await crearTemplate({ nombre, descripcion, config, es_publica: esPublica });
    }
    setGuardando(false);
    setTab('lista');
  };

  const addColumna = () => {
    setConfig({
      ...config,
      columnas: [...config.columnas, { id: `col_${Date.now()}`, label: 'Nueva columna', color: '#64748b' }]
    });
  };

  const addCampo = () => {
    setConfig({
      ...config,
      campos: [...config.campos, { id: `campo_${Date.now()}`, label: 'Nuevo campo', tipo: 'texto', requerido: false }]
    });
  };

  const updateColumna = (idx, val) => {
    const cols = [...config.columnas];
    cols[idx] = val;
    setConfig({ ...config, columnas: cols });
  };

  const updateCampo = (idx, val) => {
    const campos = [...config.campos];
    campos[idx] = val;
    setConfig({ ...config, campos });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#f8fafc', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ background: 'white', padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>🎨 Canvas Builder</h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Creá y administrá plantillas de proyectos</p>
          </div>
          <button onClick={onCerrar} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', padding: '0 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '4px' }}>
          {[{id:'lista',label:'📋 Mis plantillas'},{id:'editor',label:'✏️ Editor'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '11px 14px', fontSize: '13px', fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#2563eb' : '#64748b', borderBottom: tab === t.id ? '2px solid #2563eb' : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* TAB: Lista de templates */}
          {tab === 'lista' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Plantillas disponibles</h3>
                <button onClick={iniciarNuevo} className="agenda-btn" style={{ padding: '8px 16px', fontSize: '13px' }}>+ Nueva plantilla</button>
              </div>

              {templates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎨</div>
                  <p style={{ fontSize: '14px' }}>No hay plantillas todavía. Creá la primera.</p>
                </div>
              ) : templates.map(t => (
                <div key={t.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '10px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                      {t.nombre}
                      {t.es_publica && <span style={{ marginLeft: '8px', background: '#dbeafe', color: '#1e40af', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '5px' }}>PÚBLICA</span>}
                    </div>
                    {t.descripcion && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{t.descripcion}</div>}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {(t.config?.columnas || []).map(c => (
                        <span key={c.id} style={{ background: c.color + '20', color: c.color, border: `1px solid ${c.color}40`, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                          {c.label}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      {(t.config?.campos || []).length} campos · {(t.config?.columnas || []).length} columnas
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {proyectoActivo && (
                      <button onClick={() => aplicarTemplateAProyecto(proyectoActivo.id, t.id)}
                        style={{ background: proyectoActivo.template_id === t.id ? '#dcfce7' : '#f8fafc', border: `1px solid ${proyectoActivo.template_id === t.id ? '#86efac' : '#e2e8f0'}`, color: proyectoActivo.template_id === t.id ? '#16a34a' : '#64748b', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                        {proyectoActivo.template_id === t.id ? '✓ Aplicado' : 'Aplicar'}
                      </button>
                    )}
                    <button onClick={() => cargarTemplate(t)}
                      style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: '#475569' }}>
                      Editar
                    </button>
                    <button onClick={() => eliminarTemplate(t.id)}
                      style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: Editor */}
          {tab === 'editor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Metadatos */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Información de la plantilla</h4>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre de la plantilla"
                  style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', fontWeight: 600 }} />
                <input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción (opcional)"
                  style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '9px 12px', fontSize: '13px' }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" checked={esPublica} onChange={e => setEsPublica(e.target.checked)} />
                  Hacer pública (visible para todos los usuarios)
                </label>
              </div>

              {/* Columnas */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Columnas del Kanban</h4>
                  <button onClick={addColumna} style={{ background: '#eff6ff', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>+ Columna</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {config.columnas.map((col, i) => (
                    <ColumnaEditor key={i} columna={col}
                      onChange={val => updateColumna(i, val)}
                      onEliminar={() => setConfig({ ...config, columnas: config.columnas.filter((_, ci) => ci !== i) })} />
                  ))}
                </div>
                <div style={{ marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>VISTA PREVIA</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {config.columnas.map(col => (
                      <div key={col.id} style={{ flex: 1, background: col.color + '15', border: `1px solid ${col.color}30`, borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: col.color, textTransform: 'uppercase' }}>{col.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Campos extra */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Campos personalizados</h4>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>Los campos título y descripción son automáticos.</p>
                  </div>
                  <button onClick={addCampo} style={{ background: '#eff6ff', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>+ Campo</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {config.campos.filter(c => !['titulo', 'descripcion'].includes(c.id)).map((campo, i) => {
                    const realIdx = config.campos.findIndex(c => c.id === campo.id);
                    return (
                      <CampoEditor key={campo.id} campo={campo}
                        onChange={val => updateCampo(realIdx, val)}
                        onEliminar={() => setConfig({ ...config, campos: config.campos.filter(c => c.id !== campo.id) })} />
                    );
                  })}
                  {config.campos.filter(c => !['titulo', 'descripcion'].includes(c.id)).length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '8px' }}>
                      Sin campos extra. Hacé clic en "+ Campo" para agregar.
                    </div>
                  )}
                </div>
              </div>

              {/* Guardar */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setTab('lista')} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                  Cancelar
                </button>
                <button onClick={handleGuardar} disabled={guardando || !nombre.trim()} className="agenda-btn" style={{ padding: '10px 24px' }}>
                  {guardando ? 'Guardando...' : editando ? '💾 Actualizar plantilla' : '✅ Crear plantilla'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}