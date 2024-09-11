import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Accounts from './Accounts';
import RecentTransactions from './RecentTransactions';
import { getUserAccounts } from '../services/api';
import './Dashboard.css';

function Dashboard({ isSidebarCollapsed }) {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchAccounts();
    }
  }, [currentUser]);

  const fetchAccounts = async () => {
    try {
      const fetchedAccounts = await getUserAccounts();
      setAccounts(fetchedAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  return (
    <div className={`dashboard ${isSidebarCollapsed ? 'dashboard-collapsed' : ''}`}>
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        <div className="dashboard-welcome">
          {currentUser ? (
            <p>Bienvenido, {currentUser.email}!</p>
          ) : (
            <p>Por favor, inicia sesión para ver tu dashboard.</p>
          )}
        </div>
        {currentUser && (
          <div className="dashboard-grid">
            <div className="dashboard-section">
              <h2>Resumen de Gastos</h2>
              {/* Contenido del resumen de gastos */}
            </div>
            <div className="dashboard-section">
              <h2>Presupuesto Mensual</h2>
              {/* Contenido del presupuesto mensual */}
            </div>
            <div className="dashboard-section">
              <h2>Cuentas</h2>
              <Accounts accounts={accounts} onSync={fetchAccounts} />
            </div>
            <div className="dashboard-section">
              <h2>Transacciones Recientes</h2>
              <RecentTransactions limit={2} accounts={accounts} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;