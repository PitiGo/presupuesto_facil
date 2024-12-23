import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  register,
  login,
  logout,
  registerWithGoogle,
  getCurrentUser,
  onAuthStateChanged
} from '../services/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userId: currentUser ? currentUser.uid : null,
    signUp: register,
    signIn: login,
    signOut: logout,
    registerWithGoogle, 
    getCurrentUser
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

