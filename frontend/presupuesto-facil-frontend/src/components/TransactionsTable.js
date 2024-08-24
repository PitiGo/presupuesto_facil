import React, { useState, useEffect } from 'react';
import { getUserAccounts, getUserTransactions, updateTransaction } from '../services/api';
import './TransactionsTable.css';

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchAllTransactions();
  }, []);



  const fetchAllTransactions = async () => {
    try {
      setLoading(true);
      const accounts = await getUserAccounts();
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
      setTransactions(allTransactions);
      setError('');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('No se pudieron cargar las transacciones. Por favor, inténtelo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleSave = async (id) => {
    const transactionToUpdate = transactions.find(t => t.transaction_id === id);
    try {
      await updateTransaction(id, transactionToUpdate);
      setEditingId(null);
      // Opcionalmente, podrías volver a cargar las transacciones aquí
      // fetchAllTransactions();
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError('No se pudo actualizar la transacción. Por favor, inténtelo de nuevo.');
    }
  };

  const handleChange = (id, field, value) => {
    setTransactions(transactions.map(t => 
      t.transaction_id === id ? { ...t, [field]: value } : t
    ));
  };

  if (loading) return <div className="loading">Cargando transacciones...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="transactions-table-container">
      <h2>Todas las Transacciones</h2>
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Moneda</th>
            <th>Fecha</th>
            <th>Cuenta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction.transaction_id}>
              <td>
                {editingId === transaction.transaction_id ? 
                  <input 
                    value={transaction.description} 
                    onChange={(e) => handleChange(transaction.transaction_id, 'description', e.target.value)}
                  /> : 
                  transaction.description
                }
              </td>
              <td>
                {editingId === transaction.transaction_id ? 
                  <input 
                    type="number"
                    value={transaction.amount} 
                    onChange={(e) => handleChange(transaction.transaction_id, 'amount', e.target.value)}
                  /> : 
                  transaction.amount
                }
              </td>
              <td>{transaction.currency}</td>
              <td>{new Date(transaction.timestamp).toLocaleString()}</td>
              <td>{transaction.account_name}</td>
              <td>
                {editingId === transaction.transaction_id ? 
                  <button onClick={() => handleSave(transaction.transaction_id)}>Guardar</button> :
                  <button onClick={() => handleEdit(transaction.transaction_id)}>Editar</button>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;