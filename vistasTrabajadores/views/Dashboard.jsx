import React from 'react';

const Dashboard = ({ onLogout }) => {
  return (
    <div>
      <h2>Dashboard de Meseros</h2>
      <button onClick={onLogout}>Cerrar Sesión</button>
      {/* Aquí puedes agregar más funcionalidades del Dashboard */}
    </div>
  );
};

export default Dashboard;
