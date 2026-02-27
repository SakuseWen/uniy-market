import { createBrowserRouter } from 'react-router';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainPage,
  },
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/chat/:sellerId',
    Component: ChatPage,
  },
]);
