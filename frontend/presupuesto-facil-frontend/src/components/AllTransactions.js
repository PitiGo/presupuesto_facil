import React, { useState, useEffect } from 'react';
import { getUserAccounts, getUserTransactions } from '../services/api';
import './AllTransactions.css';

const AllTransactions = ({ limit = 2 }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const accounts = await getUserAccounts();
      let allTransactions = [];
      
      for (const account of accounts) {
        const accountTransactions = await getUserTransactions(account.account_id);
        // Añadir el nombre de la cuenta a cada transacción
        const transactionsWithAccountName = accountTransactions.map(transaction => ({
          ...transaction,
          account_name: account.account_name
        }));
        // Ordenar las transacciones de la cuenta por fecha, las más recientes primero
        transactionsWithAccountName.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        // Tomar solo las 2 más recientes
        const recentTransactions = transactionsWithAccountName.slice(0, limit);
        allTransactions = [...allTransactions, ...recentTransactions];
      }
      
      // Ordenar todas las transacciones por fecha, las más recientes primero
      allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setTransactions(allTransactions);
      setError('');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('No se pudieron cargar las transacciones. Por favor, inténtelo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando transacciones...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="all-transactions-container">
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
      {transactions.length === 0 && (
        <p className="no-transactions">No hay transacciones recientes.</p>
      )}
    </div>
  );
};

export default AllTransactions;
