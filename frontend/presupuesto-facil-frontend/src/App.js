import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Signup from './components/Signup';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />
          <div className="main-container">
            <Sidebar />
            <main className="content">
              <h2>Bienvenido a Presupuesto Fácil</h2>
              <Signup />
              {/* Aquí irán los demás componentes según la ruta */}
            </main>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
