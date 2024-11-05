import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import Menu from './views/Menu';
import Zonas from './views/Zonas';
import Opciones from './views/Opciones';
import Inventario from './views/Inventario';
import Usuarios from './views/Usuarios';
import Pedidos from './views/Pedidos';
import './App.css';
import './estilos/ayuda.css';
import './estilos/global.css';
import './estilos/rutas.css';
import './estilos/contenido.css';
import './estilos/mesas.css';
import './estilos/pedidos.css';

const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
    console.log('WebSocket connected');
};

socket.onmessage = (event) => {
    console.log('Message from server ', event.data);
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');

  const handleLogin = (status) => {
    setIsLoggedIn(status);
    localStorage.setItem('isLoggedIn', status);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
  };

  return (
      <Router>
          <nav className='rutas'>
              <Link to="/">Inicio</Link>
              <Link to="/pedidos">Pedidos</Link>
              <Link to="/menu">Menu</Link>
              <Link to="/inventario">Inventario</Link>
              <Link to="/usuarios">Usuarios</Link>
              <Link to="/opciones">Opciones</Link>
          </nav>
          <Routes>
                <Route path="/" element={<Zonas />} />
                <Route path="/pedidos" element={<Pedidos />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/inventario" element={<Inventario />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/opciones" element={<Opciones />} />
          </Routes>
      </Router>
  );
}

export default App;
