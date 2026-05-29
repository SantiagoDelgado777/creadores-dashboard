import { useState, useEffect } from 'react'
// IMPORTAMOS LOS COMPONENTES DE RECHARTS
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function App() {
  const [datosCanales, setDatosCanales] = useState(() => {
    const datosGuardados = localStorage.getItem('dashboard_datos_canales')
    
    if (datosGuardados) {
      return JSON.parse(datosGuardados)
    } else {
      return {
        bardosgames: {
          nombre: "BardosGames (Noticias)",
          youtube: { subs: "12,400", vistas: "85.2K" },
          kick: { followers: "1,250", horas: "320hs" },
          finanzas: {
            plataforma1: { fuente: "AdSense YT", monto: 18000 },
            plataforma2: { fuente: "Sponsors / Kick", monto: 27000 },
            comisiones: { fuente: "Afiliados", monto: 5000 },
            metaObjetivo: 60000,
            metaNombre: "Cámara Nueva / Lente"
          },
          // NUEVO: HISTÓRICO MENSUAL PARA EL GRÁFICO
          historico: [
            { mes: 'Feb', ingresos: 32000 },
            { mes: 'Mar', ingresos: 41000 },
            { mes: 'Abr', ingresos: 48000 },
            { mes: 'May', ingresos: 50000 }
          ],
          tareas: [
            { id: 1, titulo: "Guión: Análisis de la situación de la industria", estado: "idea" },
            { id: 2, titulo: "Miniatura para el video de hardware", estado: "progreso" },
            { id: 3, titulo: "Editar resumen del torneo semanal", estado: "listo" }
          ]
        },
        "santiago-dev": {
          nombre: "Santiago Delgado (Devlogs)",
          youtube: { subs: "3,150", vistas: "18.4K" },
          kick: { followers: "420", horas: "85hs" },
          finanzas: {
            plataforma1: { fuente: "Monetización", monto: 4500 },
            plataforma2: { fuente: "Donaciones Kick", monto: 3000 },
            comisiones: { fuente: "Pixel Art / Assets", monto: 15000 },
            metaObjetivo: 30000,
            metaNombre: "Licencias de Software / VSTs"
          },
          // NUEVO: HISTÓRICO MENSUAL PARA EL GRÁFICO
          historico: [
            { mes: 'Feb', ingresos: 11000 },
            { mes: 'Mar', ingresos: 14500 },
            { mes: 'Abr', ingresos: 19000 },
            { mes: 'May', ingresos: 22500 }
          ],
          tareas: [
            { id: 1, titulo: "Devlog #5: Optimizando el rendimiento en Linux", estado: "idea" },
            { id: 2, titulo: "Grabar voces con el SM58 y Reaper", estado: "progreso" },
            { id: 3, titulo: "Corregir bug de colisiones en las paredes", estado: "listo" }
          ]
        }
      }
    }
  })

  const [canalActivo, setCanalActivo] = useState('bardosgames')
  const [nuevaTareaTexto, setNuevaTareaTexto] = useState('')

  const canalInfo = datosCanales[canalActivo]

  useEffect(() => {
    localStorage.setItem('dashboard_datos_canales', JSON.stringify(datosCanales))
  }, [datosCanales])

  const totalIngresos = canalInfo.finanzas.plataforma1.monto + 
                        canalInfo.finanzas.plataforma2.monto + 
                        canalInfo.finanzas.comisiones.monto;

  const porcentajeMeta = Math.min(Math.round((totalIngresos / canalInfo.finanzas.metaObjetivo) * 100), 100);

  const handleAgregarTarea = (e) => {
    e.preventDefault()
    if (!nuevaTareaTexto.trim()) return

    const nuevaTarea = {
      id: Date.now(),
      titulo: nuevaTareaTexto,
      estado: 'idea'
    }

    setDatosCanales({
      ...datosCanales,
      [canalActivo]: {
        ...datosCanales[canalActivo],
        tareas: [...datosCanales[canalActivo].tareas, nuevaTarea]
      }
    })

    setNuevaTareaTexto('')
  }

  return (
    <div className="dashboard-container">
      
      {/* HEADER PRINCIPAL */}
      <header className="dashboard-header">
        <h1 className="logo-titulo">CREADORES DASHBOARD</h1>
        <div className="selector-box">
          <label>Canal Activo: </label>
          <select 
            value={canalActivo} 
            onChange={(e) => setCanalActivo(e.target.value)}
            className="comic-select"
          >
            <option value="bardosgames">BardosGames (Noticias)</option>
            <option value="santiago-dev">Santiago Delgado (Devlogs)</option>
          </select>
        </div>
      </header>

      {/* SECCIÓN 1: GRIDS SUPERIORES */}
      <div className="main-layout-grid">
        
        {/* PANEL IZQUIERDO: MÉTRICAS GENERALES */}
        <div className="dashboard-grid">
          <div className="metric-card youtube-card">
            <div className="card-header"><h2>YOUTUBE</h2></div>
            <div className="card-body">
              <p>Subscriptores: <strong>{canalInfo.youtube.subs}</strong></p>
              <p>Vistas (30d): <strong>{canalInfo.youtube.vistas}</strong></p>
            </div>
          </div>

          <div className="metric-card kick-card">
            <div className="card-header"><h2>KICK</h2></div>
            <div className="card-body">
              <p>Seguidores: <strong>{canalInfo.kick.followers}</strong></p>
              <p>Horas Vistas: <strong>{canalInfo.kick.horas}</strong></p>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: MÓDULO FINANCIERO */}
        <div className="metric-card finanzas-card">
          <div className="card-header">
            <h2>💰 CONTROL FINANCIERO</h2>
          </div>
          <div className="card-body finanzas-layout">
            <div className="monto-box">
              <h3 className="monto-ingresos">${totalIngresos.toLocaleString('es-AR')} ARS</h3>
              <p className="status-pago">Estado: Al día (AFIP)</p>
            </div>
            
            <div className="fuentes-lista">
              <p>{canalInfo.finanzas.plataforma1.fuente}: <strong>${canalInfo.finanzas.plataforma1.monto.toLocaleString('es-AR')}</strong></p>
              <p>{canalInfo.finanzas.plataforma2.fuente}: <strong>${canalInfo.finanzas.plataforma2.monto.toLocaleString('es-AR')}</strong></p>
              <p>{canalInfo.finanzas.comisiones.fuente}: <strong>${canalInfo.finanzas.comisiones.monto.toLocaleString('es-AR')}</strong></p>
            </div>

            <div className="meta-container">
              <div className="meta-info">
                <span>META: {canalInfo.finanzas.metaNombre}</span>
                <span>{porcentajeMeta}%</span>
              </div>
              <div className="comic-progress-bar">
                <div 
                  className="comic-progress-fill" 
                  style={{ width: `${porcentajeMeta}%` }}
                ></div>
              </div>
              <p className="meta-subtext">Faltan ${(canalInfo.finanzas.metaObjetivo - totalIngresos).toLocaleString('es-AR')} para alcanzar los ${canalInfo.finanzas.metaObjetivo.toLocaleString('es-AR')}</p>
            </div>
          </div>
        </div>

      </div>

      {/* NUEVA SECCIÓN MÓDULO B: GRÁFICO HISTÓRICO DE CRECIMIENTO */}
      <section className="chart-section metric-card">
        <div className="card-header">
          <h2>📊 TENDENCIA DE INGRESOS MENSUALES</h2>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={canalInfo.historico || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b32" vertical={false} />
              <XAxis dataKey="mes" stroke="#a8a8b3" tick={{ fontFamily: 'monospace', fontWeight: 'bold' }} />
              <YAxis stroke="#a8a8b3" tick={{ fontFamily: 'monospace' }} />
              <Tooltip 
                contentStyle={{ background: '#121214', border: '3px solid #000', fontFamily: 'monospace', fontWeight: 'bold' }} 
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              />
              {/* Barra gruesa con estética de bloque */}
              <Bar dataKey="ingresos" fill="#53FC18" stroke="#000" strokeWidth={2} radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* SECCIÓN 3: PLANIFICADOR DE CONTENIDO */}
      <section className="agenda-section">
        <h2 className="agenda-titulo">📋 PLAN DE PRODUCCIÓN</h2>
        
        <form onSubmit={handleAgregarTarea} className="agenda-form">
          <input 
            type="text" 
            placeholder="Escribí una nueva idea para este canal..." 
            value={nuevaTareaTexto}
            onChange={(e) => setNuevaTareaTexto(e.target.value)}
            className="agenda-input"
          />
          <button type="submit" className="agenda-btn">+ AÑADIR</button>
        </form>
        
        <div className="kanban-board">
          <div className="kanban-column column-ideas">
            <h3>IDEAS</h3>
            <div className="kanban-cards-container">
              {canalInfo.tareas.filter(t => t.estado === 'idea').map(tarea => (
                <div key={tarea.id} className="agenda-card">{tarea.titulo}</div>
              ))}
            </div>
          </div>

          <div className="kanban-column column-progreso">
            <h3>EN CURSO</h3>
            <div className="kanban-cards-container">
              {canalInfo.tareas.filter(t => t.estado === 'progreso').map(tarea => (
                <div key={tarea.id} className="agenda-card">{tarea.titulo}</div>
              ))}
            </div>
          </div>

          <div className="kanban-column column-listo">
            <h3>LISTO</h3>
            <div className="kanban-cards-container">
              {canalInfo.tareas.filter(t => t.estado === 'listo').map(tarea => (
                <div key={tarea.id} className="agenda-card">{tarea.titulo}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default App