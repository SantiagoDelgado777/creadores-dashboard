import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { DndContext, closestCenter, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- COMPONENTES ---
function SortableTask({ tarea, borrarTarea }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tarea.id });
  const style = { transform: CSS.Transform.toString(transform), transition, touchAction: 'none' };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="agenda-card">
      {tarea.titulo}
      <button onClick={(e) => { e.stopPropagation(); borrarTarea(tarea.id); }} className="delete-btn">×</button>
    </div>
  );
}

function KanbanColumn({ estado, tareas, borrarTarea }) {
  const { setNodeRef } = useDroppable({ id: estado });
  
  // AQUÍ APLICAMOS EL ORDEN ALFABÉTICO
  const tareasOrdenadas = [...tareas].sort((a, b) => a.titulo.localeCompare(b.titulo));

  return (
    <div ref={setNodeRef} className={`kanban-column column-${estado}`}>
      <h3>{estado.toUpperCase()}</h3>
      <SortableContext items={tareasOrdenadas.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-cards-container">
          {tareasOrdenadas.map(tarea => (
            <SortableTask key={tarea.id} tarea={tarea} borrarTarea={borrarTarea} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function App() {
  const [datosCanales, setDatosCanales] = useState(() => {
    const saved = localStorage.getItem('dashboard_datos_canales');
    return saved ? JSON.parse(saved) : {
        bardosgames: { nombre: "BardosGames", youtube: { subs: "12,400", vistas: "85.2K" }, kick: { followers: "1,250", horas: "320hs" }, finanzas: { plataforma1: { monto: 18000 }, plataforma2: { monto: 27000 }, comisiones: { monto: 5000 }, metaObjetivo: 60000 }, historico: [{ mes: 'Feb', ingresos: 32000 }, { mes: 'Mar', ingresos: 41000 }, { mes: 'Abr', ingresos: 48000 }, { mes: 'May', ingresos: 50000 }], tareas: [{ id: 1, titulo: "Guión", estado: "idea" }] }
    };
  });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }));
  const [canalActivo, setCanalActivo] = useState('bardosgames');
  const [nuevaTarea, setNuevaTarea] = useState('');
  const canalInfo = datosCanales[canalActivo];

  useEffect(() => localStorage.setItem('dashboard_datos_canales', JSON.stringify(datosCanales)), [datosCanales]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !['idea', 'progreso', 'listo'].includes(over.id)) return;
    const nuevasTareas = canalInfo.tareas.map(t => t.id === active.id ? { ...t, estado: over.id } : t);
    setDatosCanales({ ...datosCanales, [canalActivo]: { ...canalInfo, tareas: nuevasTareas } });
  };

  const borrarTarea = (id) => {
    const nuevasTareas = canalInfo.tareas.filter(t => t.id !== id);
    setDatosCanales({ ...datosCanales, [canalActivo]: { ...canalInfo, tareas: nuevasTareas } });
  };

  const addTarea = (e) => {
    e.preventDefault();
    if (!nuevaTarea.trim()) return;
    setDatosCanales({ ...datosCanales, [canalActivo]: { ...canalInfo, tareas: [...canalInfo.tareas, { id: Date.now(), titulo: nuevaTarea, estado: 'idea' }] } });
    setNuevaTarea('');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>CREADORES DASHBOARD</h1>
        <select onChange={(e) => setCanalActivo(e.target.value)} className="comic-select">
          <option value="bardosgames">BardosGames</option>
        </select>
      </header>

      <div className="grid-principal">
        <div className="card metrics">
          <h2>YOUTUBE: {canalInfo.youtube.subs}</h2>
          <h2>KICK: {canalInfo.kick.followers}</h2>
        </div>
        <div className="card chart">
           <ResponsiveContainer width="100%" height={150}>
             <BarChart data={canalInfo.historico}><Bar dataKey="ingresos" fill="#53FC18" /></BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      <section className="agenda-section">
        <form onSubmit={addTarea} className="agenda-form">
          <input value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} placeholder="Nueva tarea..." />
          <button type="submit">+ AÑADIR</button>
        </form>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {['idea', 'progreso', 'listo'].map(estado => (
              <KanbanColumn key={estado} estado={estado} tareas={canalInfo.tareas.filter(t => t.estado === estado)} borrarTarea={borrarTarea} />
            ))}
          </div>
        </DndContext>
      </section>
    </div>
  )
}
export default App;