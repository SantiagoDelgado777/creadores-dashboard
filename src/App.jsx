import { useState } from 'react'

function App() {
  // Datos simulados (Mock Data)
  const datosCanales = {
    bardosgames: {
      nombre: "BardosGames (Noticias)",
      youtube: { subs: "12,400", vistas: "85.2K" },
      kick: { followers: "1,250", horas: "320hs" },
      ingresos: "$45,000 ARS"
    },
    "santiago-dev": {
      nombre: "Santiago Delgado (Devlogs)",
      youtube: { subs: "3,150", vistas: "18.4K" },
      kick: { followers: "420", horas: "85hs" },
      ingresos: "$12,500 ARS"
    }
  }

  // Estado para saber qué canal mirar
  const [canalActivo, setCanalActivo] = useState('bardosgames')

  // Variable de apoyo
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

      {/* CONTENIDO DEL DASHBOARD */}
      <main className="dashboard-grid">
        
        {/* CARD YOUTUBE */}
        <div className="metric-card youtube-card">
          <div className="card-header">
            <h2>YOUTUBE</h2>
          </div>
          <div className="card-body">
            <p>Subscriptores: <strong>{canalInfo.youtube.subs}</strong></p>
            <p>Vistas (30d): <strong>{canalInfo.youtube.vistas}</strong></p>
          </div>
        </div>

        {/* CARD KICK */}
        <div className="metric-card kick-card">
          <div className="card-header">
            <h2>KICK</h2>
          </div>
          <div className="card-body">
            <p>Seguidores: <strong>{canalInfo.kick.followers}</strong></p>
            <p>Horas Vistas: <strong>{canalInfo.kick.horas}</strong></p>
          </div>
        </div>

        {/* CARD INGRESOS */}
        <div className="metric-card ingresos-card">
          <div className="card-header">
            <h2>INGRESOS ESTIMADOS</h2>
          </div>
          <div className="card-body">
            <h3 className="monto-ingresos">{canalInfo.ingresos}</h3>
            <p className="status-pago">Estado: Al día (AFIP)</p>
          </div>
        </div>

      </main>
    </div>
  )
}

export default App