import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Register Service Worker with improved error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Only attempt registration on the same origin to avoid SecurityError
    const swPath = '/sw.js';
    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    );

    if (window.location.protocol === 'https:' || isLocalhost) {
      navigator.serviceWorker.register(swPath)
        .then(reg => {
          console.log('SW registered:', reg.scope);
        })
        .catch(err => {
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