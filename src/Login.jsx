// src/Login.jsx — actualizado con link a registro
import { useState } from 'react';
import { supabase } from './supabaseClient';
import Register from './Register';

export default function Login({ setSesion }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  if (mostrarRegistro) {
    return <Register onVolver={() => setMostrarRegistro(false)} />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError('Email o contraseña incorrectos.');
    } else {
      setSesion(data.session);
    }
    setCargando(false);
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-card">
        <div>
          <h2 style={{ margin: '0 0 4px' }}>Iniciar sesión</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Creadores Dashboard</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5',
            color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              EMAIL
            </label>
            <input
              type="email" placeholder="tu@email.com"
              onChange={(e) => setEmail(e.target.value)} required
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              CONTRASEÑA
            </label>
            <input
              type="password" placeholder="Tu contraseña"
              onChange={(e) => setPassword(e.target.value)} required
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <button className="agenda-btn" type="submit" disabled={cargando} style={{ width: '100%' }}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          ¿No tenés cuenta?{' '}
          <button
            type="button" onClick={() => setMostrarRegistro(true)}
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: 0 }}
          >
            Registrarse
          </button>
        </div>
      </form>
    </div>
  );
}