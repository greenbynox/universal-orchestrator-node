import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

function applyInitialThemeFromLocalStorage() {
  try {
    const raw = localStorage.getItem('orchestratorSettings');
    if (!raw) return;
    const parsed = JSON.parse(raw) as { uiTheme?: 'light' | 'dark' | 'system' };
    const theme = parsed?.uiTheme;
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      return;
    }
    if (theme === 'dark') {
      root.classList.add('dark');
      return;
    }
    if (theme === 'light') {
      root.classList.remove('dark');
    }
  } catch {
    // ignore
  }
}

applyInitialThemeFromLocalStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgb(var(--dark-800))',
            color: 'rgb(var(--dark-50))',
            border: '1px solid rgb(var(--dark-700))',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'rgb(var(--dark-50))',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'rgb(var(--dark-50))',
            },
          },
        }}
      />
      <App />
    </HashRouter>
  </React.StrictMode>,
)
