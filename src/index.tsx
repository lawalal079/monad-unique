import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { WalletProvider } from './contexts/WalletContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>
);

window.addEventListener('error', function (event) {
  // Suppress errors from known wallet extensions
  if (
    event.filename &&
    event.filename.startsWith('chrome-extension://') &&
    event.message &&
    event.message.includes('Cannot redefine property: walletRouter')
  ) {
    event.preventDefault();
    return false;
  }
});
