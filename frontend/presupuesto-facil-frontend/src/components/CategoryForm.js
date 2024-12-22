import React, { useState, useEffect } from 'react';
import { createCategory, getCategoryGroups } from '../services/api';

const CategoryForm = ({ onCategoryAdded }) => {
    const [name, setName] = useState('');
    const [groupId, setGroupId] = useState('');
    const [categoryGroups, setCategoryGroups] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchCategoryGroups();
    }, []);

    const fetchCategoryGroups = async () => {
        try {
            const groups = await getCategoryGroups();
            console.log('Fetched category groups:', groups);
            setCategoryGroups(groups);
        } catch (error) {
            console.error('Error fetching category groups:', error);
            setError('Failed to load category groups. Please refresh the page.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        if (!name.trim()) {
            setError('Category name is required.');
            setIsLoading(false);
            return;
        }

        try {
            const newCategory = await createCategory({
                name: name.trim(),
                group_id: groupId ? parseInt(groupId) : null,
            });
            console.log('New category created:', newCategory);
            setName('');
            setGroupId('');
            setSuccessMessage('Category created successfully!');
            if (onCategoryAdded) {
                onCategoryAdded(newCategory);
            }
        } catch (error) {
            console.error('Error creating category:', error);
            setError('Failed to create category. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="category-form">
            <h2>Create Category</h2>
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            <div>
                <label htmlFor="category-name">Name:</label>
                <input
                    id="category-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>
            <div>
                <label htmlFor="category-group">Group:</label>
                <select
                    id="category-group"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    disabled={isLoading}
                >
                    <option value="">Select a group (optional)</option>
                    {categoryGroups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                </select>
            </div>
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Category'}
            </button>
        </form>
    );
};

export default CategoryForm;