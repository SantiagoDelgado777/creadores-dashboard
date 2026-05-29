import { useState } from 'react'

function App() {
  // Datos simulados (Mock Data) ampliados con tareas para la agenda
  const datosCanales = {
    bardosgames: {
      nombre: "BardosGames (Noticias)",
      youtube: { subs: "12,400", vistas: "85.2K" },
      kick: { followers: "1,250", horas: "320hs" },
      ingresos: "$45,000 ARS",
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
      ingresos: "$12,500 ARS",
      tareas: [
        { id: 1, titulo: "Devlog #5: Optimizando el rendimiento en Linux", estado: "idea" },
        { id: 2, titulo: "Grabar voces con el SM58 y Reaper", estado: "progreso" },
        { id: 3, titulo: "Corregir bug de colisiones en las paredes", estado: "listo" }
      ]
    }
  }

  const [canalActivo, setCanalActivo] = useState('bardosgames')
  const canalInfo = datosCanales[canalActivo]

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

      {/* CONTENIDO DEL DASHBOARD: MÉTRICAS */}
      <main className="dashboard-grid">
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

        <div className="metric-card ingresos-card">
          <div className="card-header"><h2>INGRESOS ESTIMADOS</h2></div>
          <div className="card-body">
            <h3 className="monto-ingresos">{canalInfo.ingresos}</h3>
            <p className="status-pago">Estado: Al día (AFIP)</p>
          </div>
        </div>
      </main>

      {/* SECCIÓN 2: PLANIFICADOR DE CONTENIDO (AGENDA) */}
      <section className="agenda-section">
        <h2 className="agenda-titulo">📋 PLAN DE PRODUCCIÓN</h2>
        
        <div className="kanban-board">
          {/* Columna: IDEAS */}
          <div className="kanban-column column-ideas">
            <h3>IDEAS</h3>
            <div className="kanban-cards-container">
              {canalInfo.tareas.filter(t => t.estado === 'idea').map(tarea => (
                <div key={tarea.id} className="agenda-card">{tarea.titulo}</div>
              ))}
            </div>
          </div>

          {/* Columna: EN PROGRESO */}
          <div className="kanban-column column-progreso">
            <h3>EN CURSO</h3>
            <div className="kanban-cards-container">
              {canalInfo.tareas.filter(t => t.estado === 'progreso').map(tarea => (
                <div key={tarea.id} className="agenda-card">{tarea.titulo}</div>
              ))}
            </div>
          </div>

          {/* Columna: LISTO */}
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