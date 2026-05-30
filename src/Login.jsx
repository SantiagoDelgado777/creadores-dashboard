import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login({ setSesion }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    
    // Intentamos loguear al usuario con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      alert(error.message);
    } else {
      // Si no hay error, actualizamos la sesión
      setSesion(data.session);
    }
    
    setCargando(false);
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-card">
        <h2>Iniciar Sesión</h2>
        <input 
          type="email" 
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit" disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}