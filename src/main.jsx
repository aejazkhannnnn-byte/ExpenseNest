
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';

import AuthenticatedApp from './AuthenticatedApp.jsx';
import './style.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthenticatedApp />
    <Analytics />
  </StrictMode>
);
