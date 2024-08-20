// src/components/Sidebar.js
import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <ul>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#presupuestos">Presupuestos</a></li>
          <li><a href="#transacciones">Transacciones</a></li>
          <li><a href="#metas">Metas</a></li>
          <li><a href="#estadisticas">Estadísticas</a></li>
        </ul>
      </nav>
    </>
  );
};

export default Sidebar;
