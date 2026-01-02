import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import Header from './components/Header';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AllProductsPage from './pages/AllProductsPage';
import CartPage from './pages/CartPage';
import ShippingPage from './pages/ShippingPage';
import PaymentPage from './pages/PaymentPage';
import PlaceOrderPage from './pages/PlaceOrderPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import NotFoundPage from './pages/NotFoundPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import AdminRoute from './components/AdminRoute';
import OrderListPage from './pages/admin/OrderListPage';
import ProductListPage from './pages/admin/ProductListPage';
import ProductEditPage from './pages/admin/ProductEditPage';
import ProductAddPage from './pages/admin/ProductAddPage';
import UserListPage from './pages/admin/UserListPage';
import UserEditPage from './pages/admin/UserEditPage';
import DashboardPage from './pages/admin/DashboardPage';
import ReviewListPage from './pages/admin/ReviewListPage';
import ErrorLogPage from './pages/admin/ErrorLogPage';
import ContentManagerPage from './pages/admin/ContentManagerPage';
import AdminLayout from './components/AdminLayout';
import NetworkStatus from './components/NetworkStatus';
import ErrorBoundary from './components/ErrorBoundary';

import { checkAuth } from './slices/authSlice';
import api from './api/axios';

import ChatWidget from './components/ChatWidget';
import ScrollToTop from './components/ScrollToTop';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const initApp = async () => {
      // 1. Check Authentication first
      let currentUser = null;
      try {
        const result = await dispatch(checkAuth()).unwrap();
        currentUser = result;
      } catch (err) {
        currentUser = null;
      }

      // 2. Track Visit with correct user type
      const today = new Date().toISOString().split('T')[0];
      const lastVisit = localStorage.getItem('lastVisitDate');

      if (lastVisit !== today) {
        const type = currentUser ? 'login' : 'guest';
        try {
          await api.post('/analytics/visit', { type });
          localStorage.setItem('lastVisitDate', today);
        } catch (err) {
          // Silent fail
        }
      }
    };

    initApp();
  }, [dispatch]);

  return (
    <Router>
      <ScrollToTop />
      <NetworkStatus />
      <ErrorBoundary>
        <Toaster position="top-center" reverseOrder={false} />
        <ChatWidget />
        <div className="min-h-screen flex flex-col relative bg-slate-50">
          {/* Subtle decorative background blobs */}
          <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px]"></div>
            <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-pink-200/40 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px]"></div>
          </div>

          <div className="relative z-10 flex flex-col min-h-screen">
            <Routes>
              {/* Public Layout with Header and Footer */}
              <Route element={
                <>
                  <Header />
                  <main className="flex-grow container mx-auto px-4 py-8">
                    <Outlet />
                  </main>
                  <footer className="glass-panel py-8 text-center text-slate-500 mt-auto border-t border-slate-200">
                    <div className="container mx-auto px-4">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p>&copy; 2025 Aadhav Madhav Ecom. All rights reserved.</p>
                        <div className="flex gap-4">
                          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        </div>
                      </div>
                    </div>
                  </footer>
                </>
              }>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<AllProductsPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/shipping" element={<ShippingPage />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/placeorder" element={<PlaceOrderPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/order/:id" element={<OrderDetailsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Admin Layout */}
              <Route element={<AdminRoute />}>
                <Route path="admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="products" element={<ProductListPage />} />
                  <Route path="products/:pageNumber" element={<ProductListPage />} />
                  <Route path="product/add" element={<ProductAddPage />} />
                  <Route path="product/:id/edit" element={<ProductEditPage />} />
                  <Route path="orders" element={<OrderListPage />} />
                  <Route path="users" element={<UserListPage />} />
                  <Route path="user/:id/edit" element={<UserEditPage />} />
                  <Route path="reviews" element={<ReviewListPage />} />
                  <Route path="errors" element={<ErrorLogPage />} />
                  <Route path="content" element={<ContentManagerPage />} />
                </Route>
              </Route>
            </Routes>
          </div>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
