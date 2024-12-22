import React from 'react';

const BudgetSummary = ({ categories, budgets }) => {
    if (!categories || categories.length === 0) {
        return <p>No hay categorías para mostrar.</p>;
    }

    return (
        <div className="budget-summary">
            <h2>Resumen de Presupuestos</h2>
            <table>
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>Estimado</th>
                        <th>Asignado</th>
                        <th>Gastado</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(category => {
                        const budget = budgets && budgets.find(b => b.category_id === category.id);
                        return (
                            <tr key={category.id}>
                                <td>{category.name}</td>
                                <td>{budget ? budget.estimated_amount : 0}</td>
                                <td>{budget ? budget.assigned_amount : 0}</td>
                                <td>{budget ? budget.spent_amount : 0}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default BudgetSummary;