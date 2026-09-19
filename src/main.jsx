import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './react/App.jsx';

const rootEl = document.getElementById('root');

if (!window.api?.auth) {
    rootEl.innerHTML =
        '<div style="display:flex;min-height:100vh;align-items:center;justify-content:center;padding:2rem;text-align:center;font-family:sans-serif;color:#f3f4f6;background:#0c0d10;">' +
        '<p>Halaman ini harus dibuka lewat aplikasi desktop (jendela Electron), bukan langsung di tab browser.<br>Jalankan <code>npm run dev</code> lalu tunggu jendela aplikasinya muncul.</p>' +
        '</div>';
    throw new Error('window.api is not available — this page was not opened inside the Electron app.');
}

createRoot(rootEl).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
