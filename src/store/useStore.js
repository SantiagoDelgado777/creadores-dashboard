// src/store/useStore.js
// Gestor global de estado con Zustand
// Instalar: npm install zustand

import { create } from 'zustand';
import { supabase } from '../supabaseClient';

export const useStore = create((set, get) => ({
  // --- AUTH ---
  sesion: null,
  perfil: null,       // { id, nombre, email, role }
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

  // --- TAREAS ---
  tareas: [],
  cargandoTareas: false,

  cargarTareas: async () => {
    const { sesion } = get();
    if (!sesion) return;
    set({ cargandoTareas: true });
    const { data } = await supabase
      .rpc('get_tareas_completas', { p_user_id: sesion.user.id });
    if (data) set({ tareas: data });
    set({ cargandoTareas: false });
  },

  addTarea: async (titulo, descripcion = '', complejidad = 'media') => {
    const { sesion, tareas } = get();
    const { data } = await supabase
      .from('tareas')
      .insert([{
        titulo,
        descripcion,
        complejidad,
        estado: 'idea',
        user_id: sesion.user.id,
        created_by: sesion.user.id
      }])
      .select();
    if (data) set({ tareas: [...tareas, ...data.map(t => ({ ...t, tags: [], responsables: [], historial: [] }))] });
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
      // Revertir si falla
      get().cargarTareas();
      return { error: error.message };
    }
    return { error: null };
  },

  // --- TAGS ---
  tags: [],           // todos los tags del usuario (para autocompletar)

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
    const { data: tagData } = await supabase
      .from('tags')
      .upsert([{ nombre: nombreTag, color, user_id: sesion.user.id }], {
        onConflict: 'nombre,user_id'
      })
      .select()
      .single();
    if (!tagData) return;
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

  // --- RESPONSABLES ---
  todosLosUsuarios: [],   // para el selector de responsables

  cargarUsuarios: async () => {
    const { data } = await supabase.from('profiles').select('id, nombre, email, role');
    if (data) set({ todosLosUsuarios: data });
  },

  asignarResponsable: async (tareaId, userId) => {
    const { sesion } = get();
    const { data } = await supabase
      .from('idea_members')
      .insert([{ tarea_id: tareaId, user_id: userId, assigned_by: sesion.user.id }])
      .select(`user_id, profiles (id, nombre, email)`)
      .single();
    if (data) {
      const nuevoResponsable = data.profiles;
      set({
        tareas: get().tareas.map(t =>
          t.id === tareaId
            ? { ...t, responsables: [...(t.responsables || []).filter(r => r.id !== userId), nuevoResponsable] }
            : t
        )
      });
    }
  },

  quitarResponsable: async (tareaId, userId) => {
    await supabase
      .from('idea_members')
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
}));


// ============================================================
// Hook: useRole — permisos granulares por acción
// ============================================================
export function useRole() {
  const perfil = useStore(s => s.perfil);
  const role = perfil?.role || 'viewer';

  return {
    role,
    esAdmin:      role === 'admin',
    esModerador:  ['admin', 'moderador'].includes(role),
    esEditor:     ['admin', 'moderador', 'editor'].includes(role),

    // Acciones específicas
    puedeCrear:        ['admin', 'moderador', 'editor'].includes(role),
    puedeEditar:       ['admin', 'moderador', 'editor'].includes(role),
    puedeModerarAListo: ['admin', 'moderador'].includes(role),
    puedeEliminar:     ['admin', 'moderador'].includes(role),
    puedeAsignar:      ['admin', 'moderador', 'editor'].includes(role),
    puedeVerAudit:     ['admin', 'moderador'].includes(role),
    puedeGestionarRoles: role === 'admin',

    // Estados permitidos para drag & drop según rol
    estadosPermitidos: (estadoActual) => {
      const FLUJO = {
        idea:     ['progreso'],
        progreso: ['idea', 'revision'],
        revision: ['progreso', ...(role !== 'editor' ? ['listo'] : [])],
        listo:    role !== 'editor' ? ['revision'] : [],
      };
      return FLUJO[estadoActual] || [];
    }
  };
}
