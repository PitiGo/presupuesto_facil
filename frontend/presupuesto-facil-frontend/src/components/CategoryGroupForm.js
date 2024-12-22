import React, { useState, useEffect } from 'react';
import { createCategoryGroup, getCategoryGroups } from '../services/api';
import './CategoryGroupForm.css';

const CategoryGroupForm = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [categoryGroups, setCategoryGroups] = useState([]);

  useEffect(() => {
    fetchCategoryGroups();
  }, []);

  const fetchCategoryGroups = async () => {
    try {
      const groups = await getCategoryGroups();
      setCategoryGroups(groups);
    } catch (error) {
      console.error('Error fetching category groups:', error);
      setError('No se pudieron cargar los grupos de categorías.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (categoryGroups.some(group => group.name.toLowerCase() === name.toLowerCase())) {
      setError(`El grupo "${name}" ya existe. Por favor, elige un nombre diferente.`);
      return;
    }

    try {
      const newGroup = await createCategoryGroup({ name });
      console.log('Grupo creado:', newGroup);
      setName('');
      setCategoryGroups([...categoryGroups, newGroup]);
    } catch (error) {
      console.error('Error creating category group:', error);
      setError('No se pudo crear el grupo. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div className="category-group-container">
      <h3>Grupos de Categorías</h3>
      <ul className="category-group-list">
        {categoryGroups.map(group => (
          <li key={group.id} className="category-group-item">{group.name}</li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="category-group-form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del nuevo grupo"
          required
          className="category-group-input"
        />
        <button type="submit" className="category-group-button">Crear grupo</button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default CategoryGroupForm;