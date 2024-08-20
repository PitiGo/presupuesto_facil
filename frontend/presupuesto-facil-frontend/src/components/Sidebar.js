// src/components/Sidebar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsCollapsed(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setIsOpen(true);
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={toggleOpen}>
        {isOpen ? '×' : '☰'}
      </button>
      <div className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <nav>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/transactions">Transacciones</Link></li>
            <li><Link to="/budget">Presupuesto</Link></li>
            {/* Añade más enlaces según sea necesario */}
          </ul>
        </nav>
      </div>
    </>
  );
}

export default Sidebar;
