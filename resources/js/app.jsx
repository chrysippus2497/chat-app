import '@vitejs/plugin-react-swc/preamble';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './bootstrap';
import '../css/app.css';
import ChatApp from './pages/ChatApp';

// Get user and token from Laravel
const laravelUser = window.Laravel?.user;
const laravelToken = window.Laravel?.token;

// Save to localStorage for API requests
if (laravelUser && laravelToken) {
    localStorage.setItem('user', JSON.stringify(laravelUser));
    localStorage.setItem('auth_token', laravelToken);
}

const root = createRoot(document.getElementById('root'));
root.render(
    <StrictMode>
        <ChatApp user={laravelUser} />
    </StrictMode>
);