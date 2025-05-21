import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProduct } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'react-hot-toast';

const Favorites = () => {
  const { toggleFavorite, addToCart, isLoggedIn } = useProduct();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch favorites from API directly
    const fetchFavorites = async () => {
      if (!isLoggedIn) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Ensure we're using /api/favorites endpoint
        const response = await axios.get(`${API_BASE_URL}/api/favorites`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Favorites fetched:', response.data);
        setFavorites(response.data);
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
        setError('Failed to load favorites. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFavorites();
  }, [isLoggedIn]);

  // Handle removing a favorite
  const handleRemoveFavorite = async (productId) => {
    try {
      // Ensure we're using /api/favorites endpoint
      await axios.delete(`${API_BASE_URL}/api/favorites/${productId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update local state
      setFavorites(favorites.filter(fav => 
        (fav.productId._id || fav.productId.id) !== productId
      ));
      
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  // Handle adding to cart
  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`Added ${product.name} to cart!`);
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Please login to view your wishlist</h2>
          <p className="text-gray-600 mb-8">You need to be logged in to see your saved favorites.</p>
          <Link to="/login">
            <Button className="bg-srblue hover:bg-blue-700">
              Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
          <Heart className="h-16 w-16 text-gray-400 animate-pulse mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Loading favorites...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Error loading favorites</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-srblue hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (favorites.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-8">You haven't added any products to your wishlist yet.</p>
          <Link to="/products">
            <Button className="bg-srblue hover:bg-blue-700">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">My Wishlist</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favorites.map(item => {
          // Handle both direct product objects and nested productId objects
          const product = item.productId || item;
          const productId = product._id || product.id;

          return (
            <div key={productId} className="product-card bg-white rounded-lg overflow-hidden shadow-md">
              <Link to={`/products/${productId}`}>
                <div className="h-48 overflow-hidden">
                  <img 
                    src={product.image || 'https://placehold.co/400x300/e2e8f0/1e293b?text=No+Image'} 
                    alt={product.name || 'Product Image'} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/400x300/e2e8f0/1e293b?text=No+Image';
                    }}
                  />
                </div>
              </Link>
              
              <div className="p-4">
                <Link to={`/products/${productId}`}>
                  <h3 className="text-lg font-semibold mb-2 hover:text-srblue transition-colors">{product.name}</h3>
                </Link>
                <p className="text-gray-600 text-sm mb-3 capitalize">{product.category}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">₹{product.price.toFixed(2)}</span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveFavorite(productId)}
                      className="text-red-500 border-red-500"
                    >
                      <Heart className="h-4 w-4 fill-current text-red-500" />
                    </Button>
                    
                    <Button
                      size="icon"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Favorites;