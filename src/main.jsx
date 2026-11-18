import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';

import AuthenticatedApp from './AuthenticatedApp.jsx';
import AdminPortal from './admin/AdminPortal.jsx';
import './style.css';

function RootApp() {
  const isAdminRoute =
    window.location.pathname.replace(/\/+$/, '') === '/admin';

  return isAdminRoute ? <AdminPortal /> : <AuthenticatedApp />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootApp />
    <Analytics />
  </StrictMode>
);