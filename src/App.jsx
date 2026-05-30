import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './Login';
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
  return (
    <div ref={setNodeRef} className={`kanban-column column-${estado}`}>
      <h3>{estado.toUpperCase()}</h3>
      <SortableContext items={tareas.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-cards-container">
          {tareas.map(tarea => <SortableTask key={tarea.id} tarea={tarea} borrarTarea={borrarTarea} />)}
        </div>
      </SortableContext>
    </div>
  );
}

// --- APP ---
export default function App() {
  const [sesion, setSesion] = useState(null);
  const [tareas, setTareas] = useState([]); // Estado único para las tareas de Supabase
  const [nuevaTarea, setNuevaTarea] = useState('');
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }));

  // 1. Cargar tareas desde Supabase al iniciar
  useEffect(() => {
    if (sesion) {
      const cargarTareas = async () => {
        const { data } = await supabase.from('tareas').select('*').eq('user_id', sesion.user.id);
        if (data) setTareas(data);
      };
      cargarTareas();
    }
  }, [sesion]);

  // 2. Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSesion(session));
    supabase.auth.onAuthStateChange((_event, session) => setSesion(session));
  }, []);

  // 3. Insertar tarea
  const addTarea = async (e) => {
    e.preventDefault();
    if (!nuevaTarea.trim()) return;
    const { data, error } = await supabase
      .from('tareas')
      .insert([{ titulo: nuevaTarea, estado: 'idea', user_id: sesion.user.id }])
      .select();
    
    if (data) setTareas([...tareas, ...data]);
    setNuevaTarea('');
  };

  // 4. Borrar tarea
  const borrarTarea = async (id) => {
    await supabase.from('tareas').delete().eq('id', id);
    setTareas(tareas.filter(t => t.id !== id));
  };

  // 5. Mover tarea (Drag and Drop)
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const columnaDestino = ['idea', 'progreso', 'listo'].includes(over.id) ? over.id : tareas.find(t => t.id === over.id)?.estado;
    
    if (columnaDestino) {
      setTareas(tareas.map(t => t.id === active.id ? { ...t, estado: columnaDestino } : t));
      await supabase.from('tareas').update({ estado: columnaDestino }).eq('id', active.id);
    }
  };

  if (!sesion) return <Login setSesion={setSesion} />;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>CREADORES DASHBOARD</h1>
        <button className="agenda-btn" onClick={() => supabase.auth.signOut()}>Cerrar Sesión</button>
      </header>

      <section className="agenda-section">
        <form onSubmit={addTarea} className="agenda-form">
          <input className="agenda-input" value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} placeholder="Nueva tarea..." />
          <button className="agenda-btn" type="submit">+ AÑADIR</button>
        </form>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {['idea', 'progreso', 'listo'].map(estado => (
              <KanbanColumn key={estado} estado={estado} tareas={tareas.filter(t => t.estado === estado)} borrarTarea={borrarTarea} />
            ))}
          </div>
        </DndContext>
      </section>
    </div>
  );
}