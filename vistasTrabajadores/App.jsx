import { useState } from 'react';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    // Lee los usuarios desde el JSON
    const usuarios = await window.electron.readUsuarios();

    // Verifica si el usuario y la contraseña son correctos
    const user = usuarios.find(
      (user) => user.usuario === username && user.contrasena === password
    );

    if (user) {
      // Aquí puedes manejar el inicio de sesión exitoso
      console.log('Inicio de sesión exitoso', user);
      setError('');
      // Redirigir a la vista de trabajador o realizar otra acción
    } else {
      // Muestra un mensaje de error si las credenciales son incorrectas
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div>
      <h1>Iniciar Sesión</h1>
      <input
        type="text"
        placeholder="Nombre de usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Iniciar Sesión</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;