import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Register Service Worker with resilience
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // In some environments, scripts are served from CDNs (cross-origin).
    // Service Workers MUST be served from the same origin as the page.
    // We try to register it from the root of the current origin.
    const swPath = '/sw.js';
    
    // Check if we are on a valid origin for SW (not a local file or some weird proxy)
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      navigator.serviceWorker.register(swPath).catch(err => {
        // Log as info/warn instead of error to prevent breaking the app experience
        console.info('Service Worker registration skipped (expected in some dev environments):', err.message);
      });
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);