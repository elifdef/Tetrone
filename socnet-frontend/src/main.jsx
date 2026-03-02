import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import "./styles/styles.css";
import './i18n'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);