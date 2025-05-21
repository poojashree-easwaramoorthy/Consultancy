
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useProduct } from '@/context/ProductContext';
import { useLanguage } from '@/context/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Home from './Home';
import About from './About';
import Products from './Products';
import ProductDetail from './ProductDetail';
import Cart from './Cart';
import Favorites from './Favorites';
import Login from './Login';
import Profile from './Profile';
import Checkout from './Checkout';
import OrderDetail from './OrderDetail';
import Admin from './Admin';

const Index = () => {
  const { user, isLoggedIn } = useProduct();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Redirect admin to admin dashboard
  useEffect(() => {
    if (isLoggedIn && user?.isAdmin && location.pathname !== '/admin') {
      navigate('/admin');
    }
  }, [isLoggedIn, user, location.pathname, navigate]);

  // Don't show navbar and footer on admin page
  const isAdminPage = location.pathname === '/admin';

  return (
    <div>
      {!isAdminPage && <Navbar />}
      <main className={!isAdminPage ? 'min-h-[calc(100vh-200px)]' : ''}>
        <Routes>
          {isLoggedIn && user?.isAdmin ? (
            <>
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/admin" />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:section" element={<Profile />} />
              <Route path="/checkout" element={
                isLoggedIn ? <Checkout /> : <Navigate to="/login" state={{ from: '/checkout' }} />
              } />
              <Route path="/order/:id" element={
                isLoggedIn ? <OrderDetail /> : <Navigate to="/login" />
              } />
              <Route path="/admin" element={
                isLoggedIn && user?.isAdmin ? <Admin /> : <Navigate to="/login" />
              } />
            </>
          )}
        </Routes>
      </main>
      {!isAdminPage && <Footer />}
    </div>
  );
};

export default Index;