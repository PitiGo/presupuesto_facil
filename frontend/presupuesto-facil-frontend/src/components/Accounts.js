import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserAccounts, getTruelayerAuthUrl, processTruelayerCallback } from '../services/api';
import './Accounts.css';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await getUserAccounts();
      setAccounts(accountsData);
      setError('');
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('No se pudieron cargar las cuentas. Por favor, inténtelo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectTruelayer = async () => {
    try {
      const response = await getTruelayerAuthUrl();
      if (response && response.auth_url) {
        window.location.href = response.auth_url;
      } else {
        throw new Error('No se recibió una URL de autenticación válida');
      }
    } catch (err) {
      console.error('Error connecting to Truelayer:', err);
      setError('No se pudo conectar con Truelayer. Por favor, inténtelo de nuevo.');
    }
  };

  if (loading) return <div className="accounts-loading">Cargando cuentas...</div>;

  return (
    <div className="accounts-container">
      <h2>Sus Cuentas</h2>
      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && (
        <div className="accounts-error">
          <p>{error}</p>
          <button onClick={fetchAccounts} className="retry-button">Intentar de nuevo</button>
        </div>
      )}
      {accounts.length === 0 ? (
        <div className="no-accounts">
          <p>No hay cuentas conectadas aún.</p>
          <button onClick={handleConnectTruelayer} className="connect-button">Conectar con Truelayer</button>
        </div>
      ) : (
        <div>
          <ul className="accounts-list">
            {accounts.map(account => (
              <li key={account.account_id} className="account-item">
                <h3>{account.account_name}</h3>
                <p>Saldo: {account.balance} {account.currency}</p>
                <p>Institución: {account.institution_name}</p>
                <p>Tipo de Cuenta: {account.account_type}</p>
              </li>
            ))}
          </ul>
          <button onClick={handleConnectTruelayer} className="connect-button">Conectar Otra Cuenta</button>
        </div>
      )}
    </div>
  );
};

export default Accounts;
