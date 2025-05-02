import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Connect to the chrome runtime
chrome.runtime.connect({ name: 'sidePanel' });

// Create root and render App
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
