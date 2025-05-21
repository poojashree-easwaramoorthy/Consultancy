import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useProduct } from '@/context/ProductContext';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  LogOut, 
  Menu,
  X
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import VoiceSearch from './VoiceSearch';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, favorites, user, logout, isLoggedIn } = useProduct();
  const { t } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Close mobile menu on location change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleVoiceSearchResult = (result) => {
    if (result.trim()) {
      navigate(`/products?search=${encodeURIComponent(result)}`);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="SR Electricals Logo" 
              className="h-10"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/200x80/e2e8f0/1e293b?text=SR+Electricals';
              }}
            />
            <span className="text-xl font-bold text-srblue ml-2 hidden sm:block">
              SR Electricals
            </span>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className={`hover:text-srblue ${location.pathname === '/' ? 'text-srblue font-medium' : ''}`}>
                {t('home')}
              </Link>
              <Link to="/about" className={`hover:text-srblue ${location.pathname === '/about' ? 'text-srblue font-medium' : ''}`}>
                {t('about')}
              </Link>
              <Link to="/products" className={`hover:text-srblue ${location.pathname.includes('/products') ? 'text-srblue font-medium' : ''}`}>
                {t('products')}
              </Link>
            </nav>
          )}

          {/* Search and Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-100 px-4 py-2 pr-10 rounded-md w-40 lg:w-64 focus:outline-none focus:ring-1 focus:ring-srblue"
                />
                <button 
                  type="submit" 
                  className="absolute right-0 top-0 h-full px-2 text-gray-400 hover:text-srblue"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
              <VoiceSearch onResult={handleVoiceSearchResult} />
            </form>

            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Cart Link */}
            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full">
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-srblue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>

            {/* Favorites Link */}
            <Link to="/favorites" className="relative p-2 hover:bg-gray-100 rounded-full">
              <Heart className="h-6 w-6" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-srblue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <User className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <p className="font-medium">{user?.name || 'User'}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      {t('profile')}
                    </Link>
                  </DropdownMenuItem>
                  {user?.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        {t('admin')}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="p-2 hover:bg-gray-100 rounded-full">
                <User className="h-6 w-6" />
              </Link>
            )}

            {/* Mobile Menu Trigger */}
            {isMobile && (
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="p-2 hover:bg-gray-100 rounded-full md:hidden"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobile && isMenuOpen && (
          <div className="bg-white border-t p-4 space-y-4 md:hidden transition-all duration-300">
            <form onSubmit={handleSearch} className="flex items-center mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 px-4 py-2 pr-10 rounded-md focus:outline-none focus:ring-1 focus:ring-srblue"
                />
                <button 
                  type="submit" 
                  className="absolute right-0 top-0 h-full px-2 text-gray-400 hover:text-srblue"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
              <VoiceSearch onResult={handleVoiceSearchResult} />
            </form>
            
            <nav className="space-y-3">
              <Link 
                to="/" 
                className={`block p-2 rounded-md ${location.pathname === '/' ? 'bg-gray-100 text-srblue' : 'hover:bg-gray-50'}`}
              >
                {t('home')}
              </Link>
              <Link 
                to="/about" 
                className={`block p-2 rounded-md ${location.pathname === '/about' ? 'bg-gray-100 text-srblue' : 'hover:bg-gray-50'}`}
              >
                {t('about')}
              </Link>
              <Link 
                to="/products" 
                className={`block p-2 rounded-md ${location.pathname.includes('/products') ? 'bg-gray-100 text-srblue' : 'hover:bg-gray-50'}`}
              >
                {t('products')}
              </Link>
              {user?.isAdmin && (
                <Link 
                  to="/admin" 
                  className={`block p-2 rounded-md ${location.pathname.includes('/admin') ? 'bg-gray-100 text-srblue' : 'hover:bg-gray-50'}`}
                >
                  {t('admin')}
                </Link>
              )}
              {isLoggedIn ? (
                <button 
                  onClick={handleLogout} 
                  className="flex items-center w-full p-2 text-red-500 rounded-md hover:bg-gray-50"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  <span>{t('logout')}</span>
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className={`block p-2 rounded-md ${location.pathname === '/login' ? 'bg-gray-100 text-srblue' : 'hover:bg-gray-50'}`}
                >
                  {t('login')}
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;