import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight, faPlus, faSave, faTimes, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { getCategoriesAndGroups, createCategoryGroup, createCategory, deleteCategory, deleteGroup, updateCategory, getSpentByCategory } from '../services/api';

const BudgetManagementContainer = styled.div`
  padding: 30px;
  background-color: #f8f9fa;
  border-radius: 15px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  font-family: 'Roboto', 'Arial', sans-serif;
`;

const Title = styled.h2`
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 28px;
  font-weight: 700;
  text-align: center;
`;

const CategoryGroupList = styled.div`
  background-color: #ffffff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
`;

const CategoryGroup = styled.div`
  border-bottom: 1px solid #e9ecef;
  transition: all 0.3s ease;

  &:last-child {
    border-bottom: none;
  }
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 18px 20px;
  cursor: pointer;
  background-color: #f8f9fa;
  transition: background-color 0.2s ease, transform 0.2s ease;

  &:hover {
    background-color: #e9ecef;
    transform: translateX(5px);
  }
`;

const GroupIcon = styled(FontAwesomeIcon)`
  margin-right: 15px;
  color: #4a5568;
  transition: transform 0.3s ease;

  ${props => props.expanded && `
    transform: rotate(90deg);
  `}
`;

const GroupName = styled.h4`
  margin: 0;
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
  flex-grow: 1;
`;

const ActionIcon = styled(FontAwesomeIcon)`
  cursor: pointer;
  margin-left: 12px;
  font-size: 18px;
  transition: color 0.2s ease, transform 0.2s ease;

  &:hover {
    transform: scale(1.2);
  }
`;

const AddIcon = styled(ActionIcon)`
  color: #38a169;

  &:hover {
    color: #2f855a;
  }
`;

const DeleteIcon = styled(ActionIcon)`
  color: #e53e3e;

  &:hover {
    color: #c53030;
  }
`;

const EditIcon = styled(ActionIcon)`
  color: #3182ce;

  &:hover {
    color: #2b6cb0;
  }
`;

const CategoryList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
  max-height: ${props => props.expanded ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.5s ease-in-out;
`;

const CategoryItem = styled.li`
  padding: 15px 20px 15px 45px;
  border-top: 1px solid #edf2f7;
  color: #4a5568;
  transition: background-color 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: #f7fafc;
  }
`;

const CategoryDetails = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 0.9em;
  color: #718096;
  margin-top: 5px;
`;

const CategoryValue = styled.span`
  margin-right: 15px;
  font-weight: 500;
`;

const NewItemForm = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background-color: #edf2f7;
`;

const NewItemInput = styled.input`
  flex-grow: 1;
  margin-right: 15px;
  padding: 10px 15px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 15px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.3);
  }
`;

const SaveIcon = styled(ActionIcon)`
  color: #38a169;

  &:hover {
    color: #2f855a;
  }
`;

const CancelIcon = styled(ActionIcon)`
  color: #e53e3e;

  &:hover {
    color: #c53030;
  }
`;

const AddGroupButton = styled.button`
  width: 100%;
  padding: 15px;
  background-color: #4299e1;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  transition: background-color 0.2s ease, transform 0.2s ease;

  &:hover {
    background-color: #3182ce;
    transform: translateY(-2px);
  }

  svg {
    margin-right: 10px;
  }
`;

const ConfirmDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  margin-right: 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease, transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ConfirmDeleteButton = styled(ConfirmButton)`
  background-color: #e53e3e;
  color: white;

  &:hover {
    background-color: #c53030;
  }
`;

const CancelDeleteButton = styled(ConfirmButton)`
  background-color: #718096;
  color: white;

  &:hover {
    background-color: #4a5568;
  }
`;

const EditForm = styled.form`
  display: flex;
  align-items: center;
  margin-top: 12px;
`;

const EditInput = styled.input`
  width: 90px;
  padding: 8px 10px;
  margin-right: 8px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.3);
  }
`;
const BudgetManagement = () => {
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [spentAmounts, setSpentAmounts] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [newGroupName, setNewGroupName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);
  const [addingCategory, setAddingCategory] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchCategoriesAndGroups();
    fetchSpentAmounts();
  }, []);

  const fetchCategoriesAndGroups = async () => {
    try {
      const data = await getCategoriesAndGroups();
      setCategories(data.categories);
      setGroups(data.groups);
    } catch (error) {
      console.error('Error fetching categories and groups:', error);
    }
  };

  const fetchSpentAmounts = async () => {
    try {
      const data = await getSpentByCategory();
      setSpentAmounts(data);
    } catch (error) {
      console.error('Error fetching spent amounts:', error);
    }
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleAddGroup = async () => {
    if (newGroupName.trim()) {
      try {
        const newGroup = await createCategoryGroup({ name: newGroupName.trim() });
        setGroups(prevGroups => [...prevGroups, newGroup]);
        setNewGroupName('');
        setAddingGroup(false);
      } catch (error) {
        console.error('Error creating group:', error);
      }
    }
  };

  const handleAddCategory = async (groupId) => {
    if (newCategoryName.trim()) {
      try {
        const newCategory = await createCategory({
          name: newCategoryName.trim(),
          group_id: groupId,
          estimated_amount: 0,
          assigned_amount: 0,
          spent_amount: 0
        });
        setCategories(prevCategories => [...prevCategories, newCategory]);
        setNewCategoryName('');
        setAddingCategory(null);
      } catch (error) {
        console.error('Error creating category:', error);
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await deleteCategory(categoryId);
      setCategories(prevCategories => prevCategories.filter(cat => cat.id !== categoryId));
      setConfirmDelete(null);
      fetchSpentAmounts(); // Actualizar los gastos después de eliminar una categoría
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteGroup(groupId);
      setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
      setCategories(prevCategories => prevCategories.filter(cat => cat.group_id !== groupId));
      setConfirmDelete(null);
      fetchSpentAmounts(); // Actualizar los gastos después de eliminar un grupo
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleEditCategory = async (categoryId, updatedData) => {
    try {
      const updatedCategory = await updateCategory(categoryId, updatedData);
      setCategories(prevCategories => prevCategories.map(cat => 
        cat.id === categoryId ? { ...cat, ...updatedCategory } : cat
      ));
      setEditingCategory(null);
      fetchSpentAmounts(); // Actualizar los gastos después de editar una categoría
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const renderCategoryItem = (category) => (
    <CategoryItem key={category.id}>
      <div>
        {category.name}
        <CategoryDetails>
          <CategoryValue>Estimado: ${(category.estimated_amount || 0).toFixed(2)}</CategoryValue>
          <CategoryValue>Asignado: ${(category.assigned_amount || 0).toFixed(2)}</CategoryValue>
          <CategoryValue>Gastado: ${(spentAmounts[category.id] || 0).toFixed(2)}</CategoryValue>
        </CategoryDetails>
      </div>
      <div>
        <EditIcon 
          icon={faEdit} 
          onClick={() => setEditingCategory(category.id)}
        />
        <DeleteIcon 
          icon={faTrash} 
          onClick={() => setConfirmDelete({ type: 'category', id: category.id })}
        />
      </div>
      {editingCategory === category.id && (
        <EditForm onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleEditCategory(category.id, {
            estimated_amount: parseFloat(formData.get('estimated')) || 0,
            assigned_amount: parseFloat(formData.get('assigned')) || 0,
          });
        }}>
          <EditInput 
            name="estimated" 
            defaultValue={category.estimated_amount || 0} 
            placeholder="Estimado" 
            type="number" 
            step="0.01" 
          />
          <EditInput 
            name="assigned" 
            defaultValue={category.assigned_amount || 0} 
            placeholder="Asignado" 
            type="number" 
            step="0.01" 
          />
          <EditInput 
            name="spent" 
            value={(spentAmounts[category.id] || 0).toFixed(2)} 
            placeholder="Gastado" 
            type="number" 
            step="0.01" 
            readOnly 
          />
          <SaveIcon icon={faSave} onClick={(e) => e.target.closest('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))} />
          <CancelIcon icon={faTimes} onClick={() => setEditingCategory(null)} />
        </EditForm>
      )}
    </CategoryItem>
  );

  return (
    <BudgetManagementContainer>
      <Title>Gestión de Presupuestos</Title>
      <CategoryGroupList>
        {groups.map(group => (
          <CategoryGroup key={group.id}>
            <GroupHeader onClick={() => toggleGroup(group.id)}>
              <GroupIcon 
                icon={expandedGroups[group.id] ? faChevronDown : faChevronRight} 
                expanded={expandedGroups[group.id]}
              />
              <GroupName>{group.name}</GroupName>
              {expandedGroups[group.id] && (
                <>
                  <AddIcon 
                    icon={faPlus} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingCategory(group.id);
                    }}
                  />
                  <DeleteIcon 
                    icon={faTrash} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ type: 'group', id: group.id });
                    }}
                  />
                </>
              )}
            </GroupHeader>
            <CategoryList expanded={expandedGroups[group.id]}>
              {categories
                .filter(category => category.group_id === group.id)
                .map(renderCategoryItem)
              }
              {addingCategory === group.id && (
                <NewItemForm>
                  <NewItemInput
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nueva categoría"
                  />
                  <SaveIcon 
                    icon={faSave} 
                    onClick={() => handleAddCategory(group.id)}
                  />
                  <CancelIcon 
                    icon={faTimes} 
                    onClick={() => setAddingCategory(null)}
                  />
                </NewItemForm>
              )}
            </CategoryList>
          </CategoryGroup>
        ))}
        <CategoryGroup>
          <GroupHeader onClick={() => toggleGroup('ungrouped')}>
            <GroupIcon 
              icon={expandedGroups['ungrouped'] ? faChevronDown : faChevronRight} 
              expanded={expandedGroups['ungrouped']}
            />
            <GroupName>Sin grupo</GroupName>
            {expandedGroups['ungrouped'] && (
              <AddIcon 
                icon={faPlus} 
                onClick={(e) => {
                  e.stopPropagation();
                  setAddingCategory('ungrouped');
                }}
              />
            )}
          </GroupHeader>
          <CategoryList expanded={expandedGroups['ungrouped']}>
            {categories
              .filter(category => !category.group_id)
              .map(renderCategoryItem)
            }
            {addingCategory === 'ungrouped' && (
              <NewItemForm>
                <NewItemInput
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nueva categoría"
                />
                <SaveIcon 
                  icon={faSave} 
                  onClick={() => handleAddCategory(null)}
                />
                <CancelIcon 
                  icon={faTimes} 
                  onClick={() => setAddingCategory(null)}
                />
              </NewItemForm>
            )}
          </CategoryList>
        </CategoryGroup>
        {addingGroup ? (
          <NewItemForm>
            <NewItemInput
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nuevo grupo"
            />
            <SaveIcon icon={faSave} onClick={handleAddGroup} />
            <CancelIcon icon={faTimes} onClick={() => setAddingGroup(false)} />
          </NewItemForm>
        ) : (
          <AddGroupButton onClick={() => setAddingGroup(true)}>
            <FontAwesomeIcon icon={faPlus} /> Añadir Grupo
          </AddGroupButton>
        )}
      </CategoryGroupList>
      {confirmDelete && (
        <ConfirmDialog>
          <p>¿Estás seguro de que quieres eliminar este {confirmDelete.type === 'group' ? 'grupo' : 'categoría'}?</p>
          <ConfirmDeleteButton onClick={() => confirmDelete.type === 'group' ? handleDeleteGroup(confirmDelete.id) : handleDeleteCategory(confirmDelete.id)}>
            Eliminar
          </ConfirmDeleteButton>
          <CancelDeleteButton onClick={() => setConfirmDelete(null)}>
            Cancelar
          </CancelDeleteButton>
        </ConfirmDialog>
      )}
    </BudgetManagementContainer>
  );
};

export default BudgetManagement;