import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import React, { useEffect, Suspense, lazy } from 'react';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import Header from './components/Header';
// Eager load critical components
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AllProductsPage = lazy(() => import('./pages/AllProductsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const ShippingPage = lazy(() => import('./pages/ShippingPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PlaceOrderPage = lazy(() => import('./pages/PlaceOrderPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage'));

// Admin Pages - Lazy Load
const OrderListPage = lazy(() => import('./pages/admin/OrderListPage'));
const ProductListPage = lazy(() => import('./pages/admin/ProductListPage'));
const ProductEditPage = lazy(() => import('./pages/admin/ProductEditPage'));
const ProductAddPage = lazy(() => import('./pages/admin/ProductAddPage'));
const UserListPage = lazy(() => import('./pages/admin/UserListPage'));
const UserEditPage = lazy(() => import('./pages/admin/UserEditPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ReviewListPage = lazy(() => import('./pages/admin/ReviewListPage'));
const ErrorLogPage = lazy(() => import('./pages/admin/ErrorLogPage'));
const ContentManagerPage = lazy(() => import('./pages/admin/ContentManagerPage'));
const CallHistoryPage = lazy(() => import('./pages/admin/CallHistoryPage'));

import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import NetworkStatus from './components/NetworkStatus';
import ErrorBoundary from './components/ErrorBoundary';

import { checkAuth } from './slices/authSlice';
import api from './api/axios';

import ChatWidget from './components/ChatWidget';
import ScrollToTop from './components/ScrollToTop';
import CallOverlay from './components/CallOverlay';

// Loading Spinner for Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

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
        <CallOverlay />
        <ChatWidget />
        <div className="min-h-screen flex flex-col relative bg-slate-50">
          {/* Subtle decorative background blobs */}
          <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px]"></div>
            <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-pink-200/40 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px]"></div>
          </div>

          <div className="relative z-10 flex flex-col min-h-screen">
            <Suspense fallback={<LoadingFallback />}>
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
                    <Route path="calls" element={<CallHistoryPage />} />
                    <Route path="user/:id/edit" element={<UserEditPage />} />
                    <Route path="reviews" element={<ReviewListPage />} />
                    <Route path="errors" element={<ErrorLogPage />} />
                    <Route path="content" element={<ContentManagerPage />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </div>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
