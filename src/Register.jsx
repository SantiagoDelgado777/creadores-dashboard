// src/Register.jsx
import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Register({ onVolver }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' });
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setCargando(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nombre: form.nombre } }
    });
    if (signUpError) {
      setError(signUpError.message);
    } else {
      setExito(true);
    }
    setCargando(false);
  };

  if (exito) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ margin: '0 0 8px' }}>¡Cuenta creada!</h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px' }}>
            Revisá tu email para confirmar tu cuenta. Después podés iniciar sesión.
          </p>
          <button className="agenda-btn" onClick={onVolver} style={{ width: '100%' }}>
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-card">
        <div>
          <h2 style={{ margin: '0 0 4px' }}>Crear cuenta</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Tu rol inicial será <strong>editor</strong>. Un admin puede cambiarlo después.
          </p>
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
              NOMBRE
            </label>
            <input
              name="nombre" type="text" placeholder="Tu nombre"
              value={form.nombre} onChange={handleChange} required
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              EMAIL
            </label>
            <input
              name="email" type="email" placeholder="tu@email.com"
              value={form.email} onChange={handleChange} required
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              CONTRASEÑA
            </label>
            <input
              name="password" type="password" placeholder="Mínimo 6 caracteres"
              value={form.password} onChange={handleChange} required
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              CONFIRMAR CONTRASEÑA
            </label>
            <input
              name="confirmar" type="password" placeholder="Repetí la contraseña"
              value={form.confirmar} onChange={handleChange} required
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <button className="agenda-btn" type="submit" disabled={cargando} style={{ width: '100%' }}>
          {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <button
          type="button" onClick={onVolver}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', padding: 0 }}
        >
          ← Ya tengo cuenta, iniciar sesión
        </button>
      </form>
    </div>
  );
}