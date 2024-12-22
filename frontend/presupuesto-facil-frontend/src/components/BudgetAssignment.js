import React, { useState, useEffect } from 'react';
import { getCategories, createBudget } from '../services/api';

const BudgetAssignment = ({ onBudgetAssigned }) => {
    const [categoryId, setCategoryId] = useState('');
    const [estimatedAmount, setEstimatedAmount] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const fetchedCategories = await getCategories();
                setCategories(fetchedCategories);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setError('Failed to load categories. Please try again.');
            }
        };
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const newBudget = await createBudget({
                category_id: parseInt(categoryId),
                estimated_amount: parseFloat(estimatedAmount),
                period_start: periodStart,
                period_end: periodEnd
            });
            setCategoryId('');
            setEstimatedAmount('');
            setPeriodStart('');
            setPeriodEnd('');
            if (onBudgetAssigned) {
                onBudgetAssigned(newBudget);
            }
        } catch (error) {
            console.error('Error creating budget:', error);
            setError('Failed to create budget. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="budget-assignment-form">
            <h2>Assign Budget</h2>
            {error && <p className="error-message">{error}</p>}
            <div>
                <label htmlFor="budget-category">Category:</label>
                <select
                    id="budget-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                >
                    <option value="">Select a category</option>
                    {categories && categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="estimated-amount">Estimated Amount:</label>
                <input
                    id="estimated-amount"
                    type="number"
                    step="0.01"
                    value={estimatedAmount}
                    onChange={(e) => setEstimatedAmount(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="period-start">Period Start:</label>
                <input
                    id="period-start"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="period-end">Period End:</label>
                <input
                    id="period-end"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Assign Budget</button>
        </form>
    );
};

export default BudgetAssignment;