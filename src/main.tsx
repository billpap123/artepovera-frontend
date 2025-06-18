// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Import Providers and Components
import { UserProvider } from './context/UserContext';
import App from './App';
import AccessibilityMenu from './components/AccessibilityMenu';

// Import your global styles
import './styles/Global.css'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* UserProvider now wraps the entire application, ensuring a single, stable state */}
      <UserProvider>
        <div className="main-app-container">
          <App />
        </div>
        {/* The AccessibilityMenu is outside the main app div but inside the provider */}
        <AccessibilityMenu />
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>,
);