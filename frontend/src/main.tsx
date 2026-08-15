import ReactDOM from 'react-dom/client';
import './container';
import { App } from './App';
import { ThemeProvider } from './components/theme-provider';
import './index.css';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
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
