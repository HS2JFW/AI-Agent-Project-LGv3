import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext'

// Global Fetch Interceptor: Automatically attach Bearer token to all /api/ requests
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = localStorage.getItem('app_auth_token');
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  
  if (token && url && (url.includes('/api/') || url.includes('/api?'))) {
    const headers = new Headers(init.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    init.headers = headers;
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
