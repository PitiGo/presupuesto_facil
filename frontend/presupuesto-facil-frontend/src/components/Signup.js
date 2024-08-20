// src/components/Signup.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const { signUp, registerWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await signUp(fullName, email, password);
      navigate('/dashboard'); // Redirige al dashboard después del registro exitoso
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setError('');
      await registerWithGoogle();
      navigate('/dashboard'); // Redirige al dashboard después del registro exitoso con Google
    } catch (err) {
      setError('Failed to sign up with Google: ' + err.message);
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      <div className="divider">or</div>
      <button onClick={handleGoogleSignup} className="google-signup-btn">
        Sign Up with Google
      </button>
    </div>
  );
};

export default Signup;
