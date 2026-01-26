import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Register Service Worker with resilience and origin checks
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Only attempt registration on the same origin to avoid SecurityError
    const swPath = '/sw.js';
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
      navigator.serviceWorker.register(swPath).catch(err => {
        console.info('Service Worker registration skipped:', err.message);
      });
    }
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Fatal: Root element not found");
}