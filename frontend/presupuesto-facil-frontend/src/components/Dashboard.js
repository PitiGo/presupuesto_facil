import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Accounts from './Accounts';
import RecentTransactions from './RecentTransactions';
import BudgetManagement from './BudgetManagement';
import { getUserAccounts, getCategories, getBudgets, getCategoryGroups } from '../services/api';
import './Dashboard.css';

function Dashboard({ isSidebarCollapsed }) {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      const [fetchedAccounts, fetchedCategories, fetchedBudgets, fetchedCategoryGroups] = await Promise.all([
        getUserAccounts(),
        getCategories(),
        getBudgets(),
        getCategoryGroups()
      ]);
      setAccounts(fetchedAccounts);
      setCategories(fetchedCategories);
      setBudgets(fetchedBudgets);
      setCategoryGroups(fetchedCategoryGroups);
    } catch (error) {
      console.error('Error fetching data:', error);
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
              <BudgetManagement
                categories={categories}
                groups={categoryGroups}
                budgets={budgets}
                onDataChanged={fetchData}
              />
            </div>
            <div className="dashboard-section">
              <h2>Cuentas</h2>
              <Accounts accounts={accounts} onSync={fetchData} />
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