// src/services/api.js
import axios from 'axios';

// Configuración de la instancia de axios
const api = axios.create({
  baseURL:'http://localhost:8000', // Ajusta la URL base según tu configuración
  timeout: 5000, // Tiempo de espera en milisegundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});


//REACT_APP_API_URL=http://localhost:8000

// Interceptor para añadir el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Función para manejar errores de API
const handleApiError = (error, defaultMessage) => {
  if (error.response) {
    // El servidor respondió con un código de estado fuera del rango 2xx
    throw new Error(error.response.data.detail || defaultMessage);
  } else if (error.request) {
    // La solicitud fue hecha pero no se recibió respuesta
    throw new Error('No se recibió respuesta del servidor');
  } else {
    // Algo sucedió en la configuración de la solicitud que provocó un error
    throw new Error(error.message || defaultMessage);
  }
};

export const registerUser = async (fullName, email, password, googleId = null) => {
  try {
    const userData = { full_name: fullName, email, password, google_id: googleId };
    if (googleId) delete userData.password;
    if (!googleId) delete userData.google_id;
    const response = await api.post('/register', userData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to register');
  }
};

export const loginUser = async (email, password, googleId = null) => {
  try {
    const loginData = { email, password, google_id: googleId };
    if (!password) delete loginData.password;
    if (!googleId) delete loginData.google_id;
    const response = await api.post('/users/login', loginData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error logging in user');
  }
};

export const checkUser = async (email, googleId = null) => {
  try {
    const response = await api.get('/me', { email, google_id: googleId });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error checking user');
  }
};

// Función para obtener la URL de autenticación de Truelayer
export const getTruelayerAuthUrl = async () => {
  try {
    const response = await api.post('/connect-truelayer');
    if (response.data && response.data.auth_url) {
      return response.data;
    } else {
      throw new Error('La respuesta no contiene una URL de autenticación válida');
    }
  } catch (error) {
    console.error('Error getting Truelayer auth URL:', error);
    throw new Error('Failed to get Truelayer authentication URL: ' + (error.response?.data?.detail || error.message));
  }
};

// Función para procesar el callback de Truelayer
export const processTruelayerCallback = async (code, state) => {
  try {
    console.log("Iniciando processTruelayerCallback");
    console.log(`Código recibido: ${code}`);
    console.log(`State recibido: ${state}`);

    if (!code) {
      throw new Error('No se recibió código de autorización');
    }

    const response = await api.get('/callback', { 
      params: { 
        code,
        state // Incluimos el state en la solicitud
      }
    });

    console.log("Respuesta del servidor:", response.data);

    if (response.data && response.data.accounts) {
      console.log(`Cuentas procesadas: ${response.data.accounts.length}`);
    }

    return response.data;
  } catch (error) {
    console.error('Error en processTruelayerCallback:', error);
    handleApiError(error, 'Failed to process Truelayer callback');
    throw error; // Re-lanzamos el error para que pueda ser manejado por el componente
  }
};

// Función para obtener las cuentas del usuario
export const getUserAccounts = async () => {
  try {
    const response = await api.get('/accounts');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get user accounts');
  }
};

export const syncUserAccounts = async () => {
  try {
    const response = await api.post('/accounts/sync');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to sync user accounts');
  }
};

export const getUserTransactions = async (accountId) => {
  try {
    const response = await api.get(`/accounts/${accountId}/transactions`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get user transactions');
  }
};

export const syncUserTransactions = async (accountId) => {
  try {
    const response = await api.post(`/accounts/${accountId}/sync-transactions`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to sync user transactions');
  }
};

export const updateTransaction = async (transactionId, updatedData) => {
  try {
    console.log('Sending update request:', updatedData);
    const response = await api.put(`/transactions/${transactionId}`, updatedData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to update transaction');
  }
};


// Añade estas nuevas funciones al final del archivo api.js

export const createBudget = async (budgetData) => {
  try {
    const response = await api.post('/budgets/', budgetData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to create budget');
  }
};



export const createCategory = async (categoryData) => {
  try {
    const response = await api.post('/categories/', categoryData);
    console.log('Category created:', response.data);  // Log para depuración
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const createCategoryGroup = async (groupData) => {
  try {
    const response = await api.post('/category-groups/', groupData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to create category group');
  }
};

export const getCategories = async () => {
  try {
    const response = await api.get('/categories/');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get categories');
  }
};

export const getBudgets = async () => {
  try {
    const response = await api.get('/budgets/');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get budgets');
  }
};

export const getReadyToAssign = async () => {
  try {
    const response = await api.get('/ready-to-assign/');
    return response.data.ready_to_assign;
  } catch (error) {
    console.error('Error fetching ready to assign amount:', error);
    handleApiError(error, 'Failed to get ready to assign amount');
  }
};


export const getCategoryGroups = async () => {
  try {
    const response = await api.get('/category-groups/');
    console.log('Category groups received:', response.data);  // Log para depuración
    return response.data;
  } catch (error) {
    console.error('Error fetching category groups:', error);
    throw error;
  }
};

export const getCategoriesAndGroups = async () => {
  try {
    const [categoriesResponse, groupsResponse] = await Promise.all([
      api.get('/categories/'),
      api.get('/category-groups/')
    ]);
    return {
      categories: categoriesResponse.data,
      groups: groupsResponse.data
    };
  } catch (error) {
    handleApiError(error, 'Failed to get categories and groups');
  }
};

export const deleteCategory = async (categoryId) => {
  try {
    const response = await api.delete(`/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to delete category');
  }
};

export const deleteGroup = async (groupId) => {
  try {
    const response = await api.delete(`/category-groups/${groupId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to delete group');
  }
};

export const updateCategory = async (categoryId, updatedData) => {
  try {
    const response = await api.put(`/categories/${categoryId}`, updatedData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to update category');
  }
};

export const updateTransactionCategory = async (transactionId, categoryId) => {
  try {
    const response = await api.put(`/transactions/${transactionId}`, { category_id: categoryId });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to update transaction category');
  }
};

export const getSpentByCategory = async () => {
  try {
    const response = await api.get('/categories/spent');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to get spent amounts by category');
  }
};