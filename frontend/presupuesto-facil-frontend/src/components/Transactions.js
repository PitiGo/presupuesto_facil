import React, { useState, useEffect } from 'react';
import { getUserTransactions, syncUserTransactions } from '../services/api';
import './Transactions.css';

const Transactions = ({ accountId }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const transactionsData = await getUserTransactions(accountId);
      setTransactions(transactionsData);
      setError('');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('No se pudieron cargar las transacciones. Por favor, inténtelo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTransactions = async () => {
    try {
      setLoading(true);
      await syncUserTransactions(accountId);
      // No llamamos a fetchTransactions aquí, se manejará en el useEffect
    } catch (err) {
      console.error('Error syncing transactions:', err);
      setError('No se pudieron sincronizar las transacciones. Por favor, inténtelo de nuevo más tarde.');
      throw err; // Propagamos el error para que pueda ser manejado en el useEffect
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeTransactions = async () => {
      try {
        setLoading(true);
        await handleSyncTransactions(); // Primero sincronizamos
        await fetchTransactions(); // Luego obtenemos las transacciones actualizadas
      } catch (err) {
        console.error('Error initializing transactions:', err);
        setError('No se pudieron inicializar las transacciones. Por favor, inténtelo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    initializeTransactions();
  }, [accountId]);

  if (loading) return <div>Cargando transacciones...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="transactions-container">
      <h3>Transacciones</h3>
      <button onClick={handleSyncTransactions}>Sincronizar transacciones</button>
      <ul className="transactions-list">
        {transactions.map(transaction => (
          <li key={transaction.transaction_id} className="transaction-item">
            <p>{transaction.description}</p>
            <p>{transaction.amount} {transaction.currency}</p>
            <p>{new Date(transaction.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Transactions;
