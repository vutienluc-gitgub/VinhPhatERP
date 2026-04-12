import React from 'react';
import ReactDOM from 'react-dom/client';

// Bootstrap Integration Layer (side-effect: registers all cross-context event handlers)
import '@/integration/IntegrationLayer';

import App from './App.tsx';
import '@/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
