import React, { useState, useEffect, useCallback } from 'react';
import { getUserAccounts, getTruelayerAuthUrl, processTruelayerCallback } from '../services/api';
import { useLocation } from 'react-router-dom';
import './Accounts.css';

const Accounts = ({ accounts: propAccounts, onSync }) => {
  const [accounts, setAccounts] = useState(propAccounts || []);
  const [loading, setLoading] = useState(!propAccounts);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const location = useLocation();

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const accountsData = await getUserAccounts();
      setAccounts(accountsData);
      setError('');
      if (onSync) onSync();
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('No se pudieron cargar las cuentas. Por favor, inténtelo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  }, [onSync]);

  const handleTruelayerCallback = useCallback(async () => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    console.log("Parámetros de URL en callback:", { code, state });

    if (code) {
      try {
        setLoading(true);
        const result = await processTruelayerCallback(code, state);
        console.log("Resultado del procesamiento del callback:", result);
        setSuccessMessage('Cuenta conectada exitosamente');
        await fetchAccounts();
      } catch (err) {
        console.error('Error processing Truelayer callback:', err);
        setError('Error al conectar la cuenta. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    } else {
      console.log("No se encontró código en los parámetros de URL");
    }
  }, [location.search, fetchAccounts]);

  useEffect(() => {
    if (propAccounts) {
      setAccounts(propAccounts);
      setLoading(false);
    } else {
      const checkForCallback = async () => {
        await handleTruelayerCallback();
        if (!location.search) {
          await fetchAccounts();
        }
      };
      checkForCallback();
    }
  }, [location, propAccounts, handleTruelayerCallback, fetchAccounts]);

  const handleConnectTruelayer = async () => {
    try {
      const response = await getTruelayerAuthUrl();
      if (response && response.auth_url) {
        console.log("Redirigiendo a URL de Truelayer:", response.auth_url);
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