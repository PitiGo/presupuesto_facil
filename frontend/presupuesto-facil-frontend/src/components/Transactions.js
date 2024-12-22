import React, { useState, useEffect } from 'react';
import { getUserTransactions, syncUserTransactions, getCategories, updateTransaction } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Transactions.css';

const Transactions = ({ accountId }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [accountId]);

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

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
      await fetchTransactions();
    } catch (err) {
      console.error('Error syncing transactions:', err);
      setError('No se pudieron sincronizar las transacciones. Por favor, inténtelo de nuevo más tarde.');
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
      console.log('Sending update request:', transactionToUpdate);
      await updateTransaction(id, transactionToUpdate);
      console.log('Update successful:', updatedTransaction);
      setEditingId(null);
      fetchTransactions(); // Refetch to ensure we have the latest data
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
            <p>
              Categoría: 
              {editingId === transaction.transaction_id ? 
                <select
                  value={transaction.category_id || ''}
                  onChange={(e) => handleChange(transaction.transaction_id, 'category_id', e.target.value)}
                >
                  <option value="">Sin categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select> :
                categories.find(c => c.id === transaction.category_id)?.name || 'Sin categoría'
              }
            </p>
            {editingId === transaction.transaction_id ? 
              <button onClick={() => handleSave(transaction.transaction_id)}>Guardar</button> :
              <button onClick={() => handleEdit(transaction.transaction_id)}>Editar</button>
            }
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Transactions;