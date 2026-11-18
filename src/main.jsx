
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';

import AuthenticatedApp from './AuthenticatedApp.jsx';
import AdminPortal from './admin/AdminPortal.jsx';
import InfoPages from './InfoPages.jsx';
import './style.css';

function RootApp() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/admin') {
    return <AdminPortal />;
  }

  if (
    ['/privacy-policy', '/about', '/contact'].includes(path)
  ) {
    return <InfoPages />;
  }

  return <AuthenticatedApp />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootApp />
    <Analytics />
  </StrictMode>
);
