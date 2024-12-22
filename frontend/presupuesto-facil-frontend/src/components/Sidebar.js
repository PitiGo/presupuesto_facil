import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <nav className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isOpen ? '×' : '≡'}
      </button>
      <ul>
        <li>
          <Link to="/dashboard">
            {isOpen ? 'Dashboard' : 'D'}
          </Link>
        </li>
        <li>
          <Link to="/accounts">
            {isOpen ? 'Cuentas' : 'C'}
          </Link>
        </li>
        <li>
          <Link to="/transactions">
            {isOpen ? 'Transacciones' : 'T'}
          </Link>
        </li>
        <li>
          <Link to="/budget-management">
            {isOpen ? 'Gestión de Presupuestos' : 'P'}
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Sidebar;