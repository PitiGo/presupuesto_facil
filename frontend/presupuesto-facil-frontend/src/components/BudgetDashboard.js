import React, { useState, useEffect } from 'react';
import CategoryGroupForm from './CategoryGroupForm';
import CategoryForm from './CategoryForm';
import BudgetAssignment from './BudgetAssignment';
import BudgetSummary from './BudgetSummary';
import ReadyToAssign from './ReadyToAssign';
import { getCategoryGroups, getCategories, getBudgets } from '../services/api';

const BudgetDashboard = () => {
    const [categoryGroups, setCategoryGroups] = useState([]);
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const groupsData = await getCategoryGroups();
        const categoriesData = await getCategories();
        const budgetsData = await getBudgets();
        setCategoryGroups(groupsData);
        setCategories(categoriesData);
        setBudgets(budgetsData);
    };

    return (
        <div className="budget-dashboard">
            <h1>Gestión de Presupuestos</h1>
            <ReadyToAssign />
            <div className="forms-section">
                <CategoryGroupForm onGroupAdded={fetchData} />
                <CategoryForm 
                    categoryGroups={categoryGroups} 
                    onCategoryAdded={fetchData} 
                />
            </div>
            <BudgetAssignment 
                categories={categories} 
                onBudgetAssigned={fetchData} 
            />
            <BudgetSummary 
                categories={categories} 
                budgets={budgets} 
            />
        </div>
    );
};

export default BudgetDashboard;