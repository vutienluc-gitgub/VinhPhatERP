import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initPlugins } from '@/app/plugins';

// Initialize ERP plugin architecture
initPlugins().catch((err) => {
  console.warn('[VinhPhat ERP] Plugin initialization warning:', err);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
