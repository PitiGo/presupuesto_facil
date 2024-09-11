import React, { useState, useEffect, useCallback } from 'react';
import { getUserTransactions, syncUserTransactions } from '../services/api';
import './RecentTransactions.css';

const RecentTransactions = ({ limit = 2, accounts }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      let allTransactions = [];

      for (const account of accounts) {
        const accountTransactions = await getUserTransactions(account.account_id);
        const transactionsWithAccountName = accountTransactions.map(transaction => ({
          ...transaction,
          account_name: account.account_name
        }));
        allTransactions = [...allTransactions, ...transactionsWithAccountName];
      }

      allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const recentTransactions = allTransactions.slice(0, limit);

      setTransactions(recentTransactions);
      setError('');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(`No se pudieron cargar las transacciones: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [accounts, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSyncTransactions = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    setError('');
    try {
      for (const account of accounts) {
        await syncUserTransactions(account.account_id);
      }
      await fetchTransactions();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error('Error syncing transactions:', err);
      setError(`No se pudieron sincronizar las transacciones: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return <div className="loading">Cargando transacciones...</div>;

  return (
    <div className="all-transactions-container">
      <div className="sync-controls">
        <button onClick={handleSyncTransactions} disabled={isSyncing}>
          {isSyncing ? 'Sincronizando...' : 'Sincronizar transacciones'}
        </button>
        {syncSuccess && <span className="sync-success">Sincronización exitosa</span>}
        {error && <span className="sync-error">{error}</span>}
      </div>
      {transactions.length > 0 ? (
        <ul className="transactions-list">
          {transactions.map(transaction => (
            <li key={transaction.transaction_id} className="transaction-item">
              <p className="description">{transaction.description}</p>
              <p className={`amount ${parseFloat(transaction.amount) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(transaction.amount).toFixed(2)} {transaction.currency}
              </p>
              <p className="timestamp">{new Date(transaction.timestamp).toLocaleString()}</p>
              <p className="account-name">Cuenta: {transaction.account_name}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-transactions">No hay transacciones recientes.</p>
      )}
    </div>
  );
};

export default RecentTransactions;