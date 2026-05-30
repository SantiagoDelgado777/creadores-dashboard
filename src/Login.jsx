/* Estilo del contenedor principal del login */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #121212; /* Fondo oscuro */
  font-family: sans-serif;
}

/* La tarjeta del login */
.login-card {
  background: #1e1e1e;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
  max-width: 350px;
}

.login-card h2 {
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-align: center;
}

/* Estilo de los inputs */
.login-card input {
  padding: 0.8rem;
  border-radius: 6px;
  border: 1px solid #333;
  background: #2a2a2a;
  color: #fff;
  font-size: 1rem;
}

.login-card input:focus {
  outline: 2px solid #53FC18; /* El verde de tu dashboard */
}

/* Estilo del botón */
.login-card button {
  padding: 0.8rem;
  border-radius: 6px;
  border: none;
  background-color: #53FC18;
  color: #000;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.login-card button:hover {
  transform: scale(1.02);
  filter: brightness(1.1);
}

.login-card button:disabled {
  background-color: #444;
  color: #888;
}