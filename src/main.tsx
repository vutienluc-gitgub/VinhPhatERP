import React from 'react';
import ReactDOM from 'react-dom/client';

import { initPlugins } from '@/app/plugins';
import { initIntegration } from '@/integration';

import App from './App.tsx';
import '@/styles/global.css';

initPlugins();
initIntegration();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
