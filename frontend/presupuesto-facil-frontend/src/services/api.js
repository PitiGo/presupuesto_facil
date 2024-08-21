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
    console.log('Token being sent:', token); // Add this line for debugging
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
    return response.data.auth_url;
  } catch (error) {
    handleApiError(error, 'Failed to get Truelayer authentication URL');
  }
};

// Función para procesar el callback de Truelayer
export const processTruelayerCallback = async (code) => {
  try {
    const response = await api.get('/callback', { params: { code } });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to process Truelayer callback');
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
