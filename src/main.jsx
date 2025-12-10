import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Manual polyfills for Vercel
if (typeof window !== 'undefined') {
  // Buffer polyfill
  if (typeof window.Buffer === 'undefined') {
    window.Buffer = require('buffer').Buffer;
  }
  // Global polyfill
  if (typeof window.global === 'undefined') {
    window.global = window;
  }
  // Process polyfill
  if (typeof window.process === 'undefined') {
    window.process = { env: {}, version: '', browser: true };
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

setTimeout(() => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.classList.add('loaded');
  }
}, 100);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
