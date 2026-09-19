import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Auto-recuperación si falla la carga de CSS o JS desfasados por ServiceWorker o Vercel rewrites
window.addEventListener(
  'error',
  (event) => {
    const errorMsg = String(event?.message || event?.error?.message || '');
    const tagName = event?.target?.tagName;
    const isResourceOrSwError =
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('Loading chunk') ||
      errorMsg.includes('ServiceWorker') ||
      errorMsg.includes('service worker') ||
      errorMsg.includes('MIME') ||
      tagName === 'SCRIPT' ||
      tagName === 'LINK';

    if (isResourceOrSwError && !sessionStorage.getItem('sw_auto_reloaded')) {
      sessionStorage.setItem('sw_auto_reloaded', 'true');
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
    }
  },
  true // Modo captura para detectar errores de carga en elementos <link> y <script>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
