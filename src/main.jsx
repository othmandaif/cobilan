import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastContainer } from './components/toast';
import { ErrorBoundary } from './components/ErrorState';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <ToastContainer />
    </ErrorBoundary>
  </React.StrictMode>
);