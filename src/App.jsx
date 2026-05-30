import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { DndContext, closestCenter, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- COMPONENTES DND ---
function SortableTask({ tarea }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tarea.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="agenda-card">
      {tarea.titulo}
    </div>
  );
}

function KanbanColumn({ estado, tareas }) {
  const { setNodeRef } = useDroppable({ id: estado });
  return (
    <div ref={setNodeRef} className={`kanban-column column-${estado}`}>
      <h3>{estado.toUpperCase()}</h3>
      <SortableContext items={tareas.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-cards-container">
          {tareas.map(tarea => <SortableTask key={tarea.id} tarea={tarea} />)}
        </div>
      </SortableContext>
    </div>
  );
}

// --- APP PRINCIPAL ---
function App() {
  const [datosCanales, setDatosCanales] = useState(() => {
    const datosGuardados = localStorage.getItem('dashboard_datos_canales');
    return datosGuardados ? JSON.parse(datosGuardados) : {
        bardosgames: {
          nombre: "BardosGames",
          youtube: { subs: "12,400", vistas: "85.2K" },
          kick: { followers: "1,250", horas: "320hs" },
          finanzas: { plataforma1: { fuente: "AdSense YT", monto: 18000 }, plataforma2: { fuente: "Sponsors / Kick", monto: 27000 }, comisiones: { fuente: "Afiliados", monto: 5000 }, metaObjetivo: 60000, metaNombre: "Cámara Nueva" },
          historico: [{ mes: 'Feb', ingresos: 32000 }, { mes: 'Mar', ingresos: 41000 }, { mes: 'Abr', ingresos: 48000 }, { mes: 'May', ingresos: 50000 }],
          tareas: [{ id: 1, titulo: "Guión industria", estado: "idea" }, { id: 2, titulo: "Miniatura", estado: "progreso" }, { id: 3, titulo: "Resumen torneo", estado: "listo" }]
        },
        "santiago-dev": {
          nombre: "Santiago Delgado",
          youtube: { subs: "3,150", vistas: "18.4K" },
          kick: { followers: "420", horas: "85hs" },
          finanzas: { plataforma1: { fuente: "Monetización", monto: 4500 }, plataforma2: { fuente: "Donaciones", monto: 3000 }, comisiones: { fuente: "Pixel Art", monto: 15000 }, metaObjetivo: 30000, metaNombre: "Licencias" },
          historico: [{ mes: 'Feb', ingresos: 11000 }, { mes: 'Mar', ingresos: 14500 }, { mes: 'Abr', ingresos: 19000 }, { mes: 'May', ingresos: 22500 }],
          tareas: [{ id: 4, titulo: "Devlog #5", estado: "idea" }, { id: 5, titulo: "Grabar voces", estado: "progreso" }, { id: 6, titulo: "Bug colisiones", estado: "listo" }]
        }
    };
  });

  const [canalActivo, setCanalActivo] = useState('bardosgames');
  const [nuevaTareaTexto, setNuevaTareaTexto] = useState('');
  const canalInfo = datosCanales[canalActivo];

  useEffect(() => { localStorage.setItem('dashboard_datos_canales', JSON.stringify(datosCanales)) }, [datosCanales]);

  // LÓGICA DND CON VALIDACIÓN
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    if (['idea', 'progreso', 'listo'].includes(over.id)) {
        const nuevasTareas = canalInfo.tareas.map(t => t.id === active.id ? { ...t, estado: over.id } : t);
        setDatosCanales({ ...datosCanales, [canalActivo]: { ...canalInfo, tareas: nuevasTareas } });
    }
  };

  // LÓGICA AGREGAR TAREA
  const handleAgregarTarea = (e) => {
    e.preventDefault();
    if (!nuevaTareaTexto.trim()) return;
    const nuevaTarea = { id: Date.now(), titulo: nuevaTareaTexto, estado: 'idea' };
    setDatosCanales({ ...datosCanales, [canalActivo]: { ...canalInfo, tareas: [...canalInfo.tareas, nuevaTarea] } });
    setNuevaTareaTexto('');
  };

  const totalIngresos = canalInfo.finanzas.plataforma1.monto + canalInfo.finanzas.plataforma2.monto + canalInfo.finanzas.comisiones.monto;
  const porcentajeMeta = Math.min(Math.round((totalIngresos / canalInfo.finanzas.metaObjetivo) * 100), 100);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="logo-titulo">CREADORES DASHBOARD</h1>
        <select value={canalActivo} onChange={(e) => setCanalActivo(e.target.value)} className="comic-select">
          <option value="bardosgames">BardosGames</option>
          <option value="santiago-dev">Santiago Delgado</option>
        </select>
      </header>

      <div className="main-layout-grid">
        <div className="dashboard-grid">
            <div className="metric-card youtube-card"><div className="card-header"><h2>YOUTUBE</h2></div><p>Subs: <strong>{canalInfo.youtube.subs}</strong></p></div>
            <div className="metric-card kick-card"><div className="card-header"><h2>KICK</h2></div><p>Seguidores: <strong>{canalInfo.kick.followers}</strong></p></div>
        </div>
        <div className="metric-card finanzas-card">
            <h2>💰 CONTROL FINANCIERO</h2>
            <p className="monto-ingresos">${totalIngresos.toLocaleString()} ARS</p>
            <div className="comic-progress-bar"><div className="comic-progress-fill" style={{ width: `${porcentajeMeta}%` }}></div></div>
        </div>
      </div>

      <section className="chart-section metric-card">
        <div className="card-header"><h2>📊 TENDENCIA DE INGRESOS</h2></div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={canalInfo.historico}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis /><Tooltip /><Bar dataKey="ingresos" fill="#53FC18" /></BarChart>
        </ResponsiveContainer>
      </section>

      <section className="agenda-section">
        <h2 className="agenda-titulo">📋 PLAN DE PRODUCCIÓN</h2>
        <form onSubmit={handleAgregarTarea} className="agenda-form">
          <input value={nuevaTareaTexto} onChange={(e) => setNuevaTareaTexto(e.target.value)} placeholder="Nueva idea..." className="agenda-input" />
          <button type="submit" className="agenda-btn">+ AÑADIR</button>
        </form>
        
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {['idea', 'progreso', 'listo'].map(estado => (
               <KanbanColumn key={estado} estado={estado} tareas={canalInfo.tareas.filter(t => t.estado === estado)} />
            ))}
          </div>
        </DndContext>
      </section>
    </div>
  )
}
export default App;