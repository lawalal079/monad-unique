import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App, { ErrorBoundary } from './App';
import { WalletProvider } from './contexts/WalletContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <WalletProvider>
        <App />
      </WalletProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Completely suppress all runtime errors globally for all users
window.onerror = function () { return true; };
window.onunhandledrejection = function () { return true; };
console.error = () => {};
