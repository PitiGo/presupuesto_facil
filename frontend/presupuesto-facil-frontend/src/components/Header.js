import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { currentUser, signOut } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <img src="/logo512.png" alt="Presupuesto Fácil Logo" />
          <span>Presupuesto Fácil</span>
        </Link>
        
        {currentUser ? (
          <div className="user-info">
            <img src={currentUser.photoURL || '/default-avatar.png'} alt="User Avatar" className="user-avatar" />
            <span>{currentUser.displayName || currentUser.email}</span>
            <button onClick={signOut}>Cerrar sesión</button>
          </div>
        ) : (
          <nav className="nav-menu">
            <ul>
              <li><Link to="/login">Iniciar sesión</Link></li>
              <li><Link to="/signup">Registrarse</Link></li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
