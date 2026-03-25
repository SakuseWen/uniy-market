import { createBrowserRouter } from 'react-router';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import CreateProductPage from './pages/CreateProductPage';
import MyPage from './pages/MyPage';
import EditProductPage from './pages/EditProductPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import SellerProfilePage from './pages/SellerProfilePage';

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
  {
    path: '/create-product',
    Component: CreateProductPage,
  },
  {
    path: '/my-page',
    Component: MyPage,
  },
  {
    path: '/edit-product/:productId',
    Component: EditProductPage,
  },
  {
    path: '/verify-email',
    Component: EmailVerificationPage,
  },
  {
    path: '/seller/:sellerId',
    Component: SellerProfilePage,
  },
]);
