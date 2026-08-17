import ReactDOM from 'react-dom/client';
import './container';
import { App } from './App';
import { ThemeProvider } from './components/theme-provider';
import './index.css';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const swUrl = `${import.meta.env.BASE_URL}sw.js`;
        navigator.serviceWorker
            .register(swUrl)
            .then(() => {
                // Première activation : recharge une fois pour que la page et tous
                // ses assets (JS/CSS) passent par le service worker et soient mis en cache.
                if (!navigator.serviceWorker.controller && !sessionStorage.getItem('cadmus-sw-reloaded')) {
                    sessionStorage.setItem('cadmus-sw-reloaded', '1');
                    window.location.reload();
                }
            })
            .catch((error: unknown) => {
                console.error('Service worker registration failed', error);
            });
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    // <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="cadmus-theme">
        <App />
    </ThemeProvider>
    // </React.StrictMode>
);
