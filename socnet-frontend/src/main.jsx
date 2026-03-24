import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import './i18n'

import "./styles/admin.css";
import "./styles/auth.css";
import "./styles/chat-modern.css";
import "./styles/chat-old.css";
import "./styles/comments.css";
import "./styles/sticker.css";
import "./styles/friends.css";
import "./styles/global.css";
import "./styles/landing.css";
import "./styles/layout.css";
import "./styles/modal.css";
import "./styles/notifications.css";
import "./styles/poll.css";
import "./styles/post.css";
import "./styles/profile-classic.css";
import "./styles/profile-modern.css";
import "./styles/settings.css";
import "./styles/ui.css";
import "./styles/video.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Не робити запит, коли юзер згорнув/розгорнув браузер
      staleTime: 1000 * 60 * 2,    // Дані вважаються "свіжими" 2 хвилини
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);