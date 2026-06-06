// src/store/useStore.js
// Estado global completo con Zustand - Versión actualizada

import { create } from 'zustand';
import { supabase } from '../supabaseClient';

export const useStore = create((set, get) => ({

  // ─────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────
  sesion: null,
  perfil: null,
  cargandoAuth: true,

  setSesion: (sesion) => set({ sesion }),

  cargarPerfil: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) set({ perfil: data });
  },

  // ─────────────────────────────────────────────
  // PROYECTOS
  // ─────────────────────────────────────────────
  proyectos: [],
  proyectoActivo: null,

  cargarProyectos: async () => {
    const { sesion } = get();
    if (!sesion) return;
    
    // Proyectos donde es owner
    const { data: propios } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', sesion.user.id);
    
    // Proyectos donde es miembro
    const { data: miembro } = await supabase
      .from('project_members')
      .select('project_id, role, projects(*)')
      .eq('user_id', sesion.user.id);
    
    const deMiembro = (miembro || []).map(m => ({ ...m.projects, rolEnProyecto: m.role }));
    const todos = [...(propios || []), ...deMiembro.filter(p => !propios?.some(pr => pr.id === p.id))];
    
    set({ proyectos: todos });
    
    if (!get().proyectoActivo && todos.length > 0) {
      set({ proyectoActivo: todos[0] });
      get().cargarTareas(todos[0].id);
    }
  },

  crearProyecto: async ({ nombre, descripcion, color, icono }) => {
    const { sesion } = get();
    const { data, error } = await supabase
      .from('projects')
      .insert([{ nombre, descripcion, color, icono, owner_id: sesion.user.id }])
      .select()
      .single();
    
    if (data && !error) {
      set({ proyectos: [...get().proyectos, data], proyectoActivo: data });
      get().cargarTareas(data.id);
      return data;
    }
    return null;
  },

  actualizarProyecto: async (id, campos) => {
    await supabase.from('projects').update(campos).eq('id', id);
    set({
      proyectos: get().proyectos.map(p => p.id === id ? { ...p, ...campos } : p),
      proyectoActivo: get().proyectoActivo?.id === id ? { ...get().proyectoActivo, ...campos } : get().proyectoActivo
    });
  },

  eliminarProyecto: async (id) => {
    await supabase.from('projects').delete().eq('id', id);
    const restantes = get().proyectos.filter(p => p.id !== id);
    set({ proyectos: restantes, proyectoActivo: restantes[0] || null, tareas: [] });
    if (restantes[0]) get().cargarTareas(restantes[0].id);
  },

  seleccionarProyecto: (proyecto) => {
    set({
      proyectoActivo: proyecto,
      tareas: [],
      filtros: { busqueda: '', estado: 'todos', complejidad: 'todos', tag: 'todos', responsable: 'todos' }
    });
    get().cargarTareas(proyecto.id);
  },

  // ─────────────────────────────────────────────
  // FILTROS
  // ─────────────────────────────────────────────
  filtros: {
    busqueda: '',
    estado: 'todos',
    complejidad: 'todos',
    tag: 'todos',
    responsable: 'todos',
  },

  setFiltro: (campo, valor) => set({ filtros: { ...get().filtros, [campo]: valor } }),
  
  limpiarFiltros: () => set({ 
    filtros: { busqueda: '', estado: 'todos', complejidad: 'todos', tag: 'todos', responsable: 'todos' } 
  }),

  // ─────────────────────────────────────────────
  // TAREAS (con filtros)
  // ─────────────────────────────────────────────
  tareas: [],
  cargandoTareas: false,

  get tareasFiltradas() {
    const { tareas, filtros } = get();
    return tareas.filter(t => {
      // Búsqueda por texto
      if (filtros.busqueda && !t.titulo.toLowerCase().includes(filtros.busqueda.toLowerCase()) &&
          !(t.descripcion || '').toLowerCase().includes(filtros.busqueda.toLowerCase())) return false;
      // Filtro por estado
      if (filtros.estado !== 'todos' && t.estado !== filtros.estado) return false;
      // Filtro por complejidad
      if (filtros.complejidad !== 'todos' && t.complejidad !== filtros.complejidad) return false;
      // Filtro por tag
      if (filtros.tag !== 'todos' && !(t.tags || []).some(tg => tg.id === filtros.tag)) return false;
      // Filtro por responsable
      if (filtros.responsable !== 'todos' && !(t.responsables || []).some(r => r.id === filtros.responsable)) return false;
      return true;
    });
  },

  cargarTareas: async (projectId) => {
    const { sesion } = get();
    if (!sesion) return;
    
    const pid = projectId || get().proyectoActivo?.id || null;
    set({ cargandoTareas: true });
    
    const { data, error } = await supabase
      .rpc('get_tareas_completas', { 
        p_user_id: sesion.user.id, 
        p_project_id: pid 
      });
    
    if (data && !error) set({ tareas: data });
    set({ cargandoTareas: false });
  },

  addTarea: async ({ titulo, descripcion = '', complejidad = 'media', horas_estimadas = null }) => {
    const { sesion, proyectoActivo, tareas } = get();
    
    const { data, error } = await supabase
      .from('tareas')
      .insert([{
        titulo,
        descripcion,
        complejidad,
        horas_estimadas,
        estado: 'idea',
        user_id: sesion.user.id,
        created_by: sesion.user.id,
        project_id: proyectoActivo?.id || null
      }])
      .select()
      .single();
    
    if (data && !error) {
      set({ 
        tareas: [...tareas, { ...data, tags: [], responsables: [], historial: [], campos: {} }] 
      });
      return data;
    }
    return null;
  },

  editarTarea: async (id, campos) => {
    const { error } = await supabase.from('tareas').update(campos).eq('id', id);
    if (!error) {
      set({ tareas: get().tareas.map(t => t.id === id ? { ...t, ...campos } : t) });
    }
    return { error: error?.message || null };
  },

  borrarTarea: async (id) => {
    await supabase.from('tareas').delete().eq('id', id);
    set({ tareas: get().tareas.filter(t => t.id !== id) });
  },

  moverTarea: async (tareaId, nuevoEstado) => {
    const { perfil } = get();
    
    // Verificar permisos: solo moderador/admin pueden mover a 'listo'
    if (nuevoEstado === 'listo' && !['admin', 'moderador'].includes(perfil?.role)) {
      return { error: 'Solo un moderador puede aprobar tareas.' };
    }
    
    // Optimistic update
    set({
      tareas: get().tareas.map(t =>
        t.id === tareaId ? { ...t, estado: nuevoEstado } : t
      )
    });
    
    const { error } = await supabase
      .from('tareas')
      .update({ estado: nuevoEstado })
      .eq('id', tareaId);
    
    if (error) {
      get().cargarTareas();
      return { error: error.message };
    }
    return { error: null };
  },

  // ─────────────────────────────────────────────
  // TAGS
  // ─────────────────────────────────────────────
  tags: [],

  cargarTags: async () => {
    const { sesion } = get();
    if (!sesion) return;
    
    const { data } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', sesion.user.id);
    
    if (data) set({ tags: data });
  },

  addTagATarea: async (tareaId, nombreTag, color = '#6366f1') => {
    const { sesion } = get();
    
    // Insertar o encontrar el tag
    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .upsert([{ nombre: nombreTag, color, user_id: sesion.user.id }], { 
        onConflict: 'nombre,user_id' 
      })
      .select()
      .single();
    
    if (tagError || !tagData) return;
    
    // Asociar a la tarea
    await supabase
      .from('tarea_tags')
      .upsert([{ tarea_id: tareaId, tag_id: tagData.id }]);
    
    // Actualizar estado local
    set({
      tareas: get().tareas.map(t =>
        t.id === tareaId
          ? { ...t, tags: [...(t.tags || []).filter(tg => tg.id !== tagData.id), tagData] }
          : t
      )
    });
    get().cargarTags();
  },

  removeTagDeTarea: async (tareaId, tagId) => {
    await supabase
      .from('tarea_tags')
      .delete()
      .match({ tarea_id: tareaId, tag_id: tagId });
    
    set({
      tareas: get().tareas.map(t =>
        t.id === tareaId
          ? { ...t, tags: (t.tags || []).filter(tg => tg.id !== tagId) }
          : t
      )
    });
  },

  eliminarTagGlobal: async (tagId) => {
    await supabase.from('tags').delete().eq('id', tagId);
    set({
      tags: get().tags.filter(t => t.id !== tagId),
      tareas: get().tareas.map(t => ({ 
        ...t, 
        tags: (t.tags || []).filter(tg => tg.id !== tagId) 
      }))
    });
  },

  // ─────────────────────────────────────────────
  // RESPONSABLES (usando tarea_asignados)
  // ─────────────────────────────────────────────
  todosLosUsuarios: [],

  cargarUsuarios: async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, nombre, email, role');
    if (data) set({ todosLosUsuarios: data });
  },

  asignarResponsable: async (tareaId, userId) => {
    const { sesion } = get();
    
    const { data, error } = await supabase
      .from('tarea_asignados')
      .insert([{ tarea_id: tareaId, user_id: userId, assigned_by: sesion.user.id }])
      .select('user_id, profiles(id, nombre, email)')
      .single();
    
    if (data?.profiles && !error) {
      set({
        tareas: get().tareas.map(t =>
          t.id === tareaId
            ? { ...t, responsables: [...(t.responsables || []).filter(r => r.id !== userId), data.profiles] }
            : t
        )
      });
    }
  },

  quitarResponsable: async (tareaId, userId) => {
    await supabase
      .from('tarea_asignados')
      .delete()
      .match({ tarea_id: tareaId, user_id: userId });
    
    set({
      tareas: get().tareas.map(t =>
        t.id === tareaId
          ? { ...t, responsables: (t.responsables || []).filter(r => r.id !== userId) }
          : t
      )
    });
  },

  // ─────────────────────────────────────────────
  // NOTIFICACIONES (realtime)
  // ─────────────────────────────────────────────
  notificaciones: [],
  notifNoLeidas: 0,

  cargarNotificaciones: async () => {
    const { sesion } = get();
    if (!sesion) return;
    
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', sesion.user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (data) set({ 
      notificaciones: data, 
      notifNoLeidas: data.filter(n => !n.leida).length 
    });
  },

  marcarTodasLeidas: async () => {
    const { sesion } = get();
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('user_id', sesion.user.id)
      .eq('leida', false);
    
    set({ 
      notificaciones: get().notificaciones.map(n => ({ ...n, leida: true })), 
      notifNoLeidas: 0 
    });
  },

  marcarLeidaUna: async (id) => {
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id);
    
    set({
      notificaciones: get().notificaciones.map(n => n.id === id ? { ...n, leida: true } : n),
      notifNoLeidas: Math.max(0, get().notifNoLeidas - 1)
    });
  },

  suscribirNotificaciones: () => {
    const { sesion } = get();
    if (!sesion) return () => {};
    
    const channel = supabase
      .channel(`notificaciones-${sesion.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `user_id=eq.${sesion.user.id}`
        },
        (payload) => {
          set({
            notificaciones: [payload.new, ...get().notificaciones],
            notifNoLeidas: get().notifNoLeidas + 1
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ─────────────────────────────────────────────
  // CANVAS TEMPLATES
  // ─────────────────────────────────────────────
  templates: [],
  templateActivo: null,

  cargarTemplates: async () => {
    const { sesion } = get();
    if (!sesion) return;
    
    const { data } = await supabase
      .from('canvas_templates')
      .select('*')
      .or(`owner_id.eq.${sesion.user.id},es_publica.eq.true`)
      .order('created_at', { ascending: false });
    
    if (data) set({ templates: data });
  },

  crearTemplate: async ({ nombre, descripcion, config, es_publica = false }) => {
    const { sesion } = get();
    
    const { data } = await supabase
      .from('canvas_templates')
      .insert([{ nombre, descripcion, config, es_publica, owner_id: sesion.user.id }])
      .select()
      .single();
    
    if (data) set({ 
      templates: [data, ...get().templates], 
      templateActivo: data 
    });
    return data;
  },

  actualizarTemplate: async (id, campos) => {
    const { error } = await supabase
      .from('canvas_templates')
      .update(campos)
      .eq('id', id);
    
    if (!error) {
      set({ 
        templates: get().templates.map(t => t.id === id ? { ...t, ...campos } : t) 
      });
      if (get().templateActivo?.id === id) {
        set({ templateActivo: { ...get().templateActivo, ...campos } });
      }
    }
  },

  eliminarTemplate: async (id) => {
    await supabase.from('canvas_templates').delete().eq('id', id);
    set({ 
      templates: get().templates.filter(t => t.id !== id), 
      templateActivo: null 
    });
  },

  aplicarTemplateAProyecto: async (projectId, templateId) => {
    await supabase
      .from('projects')
      .update({ template_id: templateId })
      .eq('id', projectId);
    
    set({ 
      proyectos: get().proyectos.map(p => 
        p.id === projectId ? { ...p, template_id: templateId } : p
      ) 
    });
  },

  guardarCampoTarea: async (tareaId, campoId, valor) => {
    const { error } = await supabase
      .from('tarea_campos')
      .upsert(
        [{ tarea_id: tareaId, campo_id: campoId, valor }],
        { onConflict: 'tarea_id,campo_id' }
      );
    
    if (!error) {
      set({
        tareas: get().tareas.map(t =>
          t.id === tareaId
            ? { ...t, campos: { ...(t.campos || {}), [campoId]: valor } }
            : t
        )
      });
    }
  },

}));

// ─────────────────────────────────────────────────────────────
// Hook: useRole — permisos granulares por acción
// ─────────────────────────────────────────────────────────────
export function useRole() {
  const perfil = useStore(s => s.perfil);
  const role = perfil?.role || 'viewer';

  return {
    role,
    esAdmin: role === 'admin',
    esModerador: ['admin', 'moderador'].includes(role),
    esEditor: ['admin', 'moderador', 'editor'].includes(role),

    // Acciones específicas
    puedeCrear: ['admin', 'moderador', 'editor'].includes(role),
    puedeEditar: ['admin', 'moderador', 'editor'].includes(role),
    puedeModerarAListo: ['admin', 'moderador'].includes(role),
    puedeEliminar: ['admin', 'moderador'].includes(role),
    puedeAsignar: ['admin', 'moderador', 'editor'].includes(role),
    puedeVerAudit: ['admin', 'moderador'].includes(role),
    puedeGestionarRoles: role === 'admin',
    puedeGestionarTemplates: ['admin', 'moderador'].includes(role),

    // Estados permitidos para drag & drop según rol
    estadosPermitidos: (estadoActual) => {
      const FLUJO = {
        idea: ['progreso'],
        progreso: ['idea', 'revision'],
        revision: ['progreso', ...(role !== 'editor' ? ['listo'] : [])],
        listo: role !== 'editor' ? ['revision'] : [],
      };
      return FLUJO[estadoActual] || [];
    }
  };
}