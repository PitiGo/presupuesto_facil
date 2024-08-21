import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserAccounts, getTruelayerAuthUrl, processTruelayerCallback } from '../services/api';
import './Accounts.css';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchAccounts();
    // Verificar si hay un código de autorización en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleTruelayerCallback(code);
    }
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await getUserAccounts();
      setAccounts(accountsData);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch accounts');
      setLoading(false);
    }
  };

  const handleConnectTruelayer = async () => {
    try {
      const authUrl = await getTruelayerAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to connect to Truelayer');
    }
  };

  const handleTruelayerCallback = async (code) => {
    try {
      setLoading(true);
      await processTruelayerCallback(code);
      await fetchAccounts(); // Refetch accounts after processing callback
      // Remove code from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError('Failed to process Truelayer callback');
      setLoading(false);
    }
  };

  if (loading) return <div className="accounts-loading">Loading accounts...</div>;
  if (error) return <div className="accounts-error">{error}</div>;

  return (
    <div className="accounts-container">
      <h2>Your Accounts</h2>
      {accounts.length === 0 ? (
        <div className="no-accounts">
          <p>No accounts connected yet.</p>
          <button onClick={handleConnectTruelayer} className="connect-button">Connect to Truelayer</button>
        </div>
      ) : (
        <div>
          <ul className="accounts-list">
            {accounts.map(account => (
              <li key={account.id} className="account-item">
                <h3>{account.account_name}</h3>
                <p>Balance: {account.balance} {account.currency}</p>
                <p>Institution: {account.institution_name}</p>
              </li>
            ))}
          </ul>
          <button onClick={handleConnectTruelayer} className="connect-button">Connect Another Account</button>
        </div>
      )}
    </div>
  );
};

export default Accounts;
