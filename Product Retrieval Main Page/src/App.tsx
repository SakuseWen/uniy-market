import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './services/authContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './lib/LanguageContext';
import { ChatNotificationProvider } from './services/ChatNotificationContext';

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          {/* 13.2 全局聊天通知 Context / Global chat notification context */}
          <ChatNotificationProvider>
            <RouterProvider router={router} />
          </ChatNotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
