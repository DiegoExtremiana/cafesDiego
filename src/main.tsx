import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { initNativeSessionBridge } from '@/lib/nativeSession';

// Solo actúa dentro de la app nativa (Capacitor); en web no hace nada.
initNativeSessionBridge();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento raíz #root');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
