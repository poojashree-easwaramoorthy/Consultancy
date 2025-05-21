import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useProduct } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Heart, Search, Check } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'react-hot-toast';
import cartService from '@/services/cartService';
import { Widget } from 'react-chat-widget';
import 'react-chat-widget/lib/styles.css';

const Products = () => {
  const { products, addToCart, prepareProductDetailNavigation, isLoggedIn } = useProduct();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [favorites, setFavorites] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState({}); // Track items in cart

  // Handle chatbot messages
  const handleChatMessage = async (message) => {
    try {
      // Extract product name from the message
      const productName = message.toLowerCase();

      // Fetch product details from the backend
      const response = await axios.get(`${API_BASE_URL}/api/products?name=${productName}`);
      const product = response.data;

      if (product) {
        const reply = `Here are the details for ${product.name}:
        - Price: ₹${product.price.toFixed(2)}
        - Category: ${product.category}
        - Description: ${product.description}`;
        toast.success(reply);
      } else {
        toast.error("Sorry, I couldn't find that product.");
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error("Something went wrong. Please try again later.");
    }
  };

  // Get category from URL params
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  // Fetch user favorites on component mount
  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem('token');
      if (!token) return; // Not logged in
      
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const favMap = {};
        response.data.forEach(fav => {
          const productId = fav.productId._id || fav.productId.id;
          favMap[productId] = true;
        });
        
        setFavorites(favMap);
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFavorites();
  }, []);

  // Fetch cart data when component mounts or user logs in
  useEffect(() => {
    const fetchCartData = async () => {
      if (!isLoggedIn) return;

      try {
        setIsLoading(true);
        const cartData = await cartService.getCart(navigate);
        const cartMap = {};
        if (cartData && cartData.items) {
          cartData.items.forEach(item => {
            const productId = item.productId?._id || item.productId;
            if (productId) {
              cartMap[productId] = {
                quantity: item.quantity || 1,
                inCart: true
              };
            }
          });
        }
        setCartItems(cartMap);
      } catch (error) {
        console.error("Failed to fetch cart in Products page:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCartData();
  }, [isLoggedIn]);

  // Filter products based on search term, category, and sort
  useEffect(() => {
    let result = [...products];
    
    if (searchTerm) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    if (sortBy === 'price-low-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high-low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-a-z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-z-a') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }
    
    setFilteredProducts(result);
  }, [products, searchTerm, selectedCategory, sortBy]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category !== 'all') {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  const handleProductClick = (product) => {
    const actualId = product.id || product._id;
    if (!actualId) {
      console.error("Product ID is missing:", product);
      return;
    }
    navigate(`/products/${actualId}`);
  };

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to add items to the cart");
      navigate("/login");
      return;
    }

    const productId = product.id || product._id;

    if (cartItems[productId] && cartItems[productId].inCart) {
      toast.success(`${product.name} is already in your cart!`);
      return;
    }
    
    try {
      await axios.post(`${API_BASE_URL}/api/cart`, {
        productId,
        quantity: 1,
        price: product.price,
        name: product.name,
        image: product.image
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setCartItems(prev => ({
        ...prev,
        [productId]: {
          quantity: 1,
          inCart: true
        }
      }));

      addToCart(product);
      toast.success(`Added ${product.name} to cart!`);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        console.error("Failed to add item to cart:", error);
        toast.error("Failed to add to cart. Please try again.");
      }
    }
  };

  const toggleFavorite = async (product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to add favorites");
      navigate("/login");
      return;
    }

    const productId = product.id || product._id;

    try {
      if (favorites[productId]) {
        await axios.delete(`${API_BASE_URL}/api/favorites/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setFavorites(prev => {
          const newFavorites = { ...prev };
          delete newFavorites[productId];
          return newFavorites;
        });

        toast.success("Removed from favorites");
      } else {
        await axios.post(`${API_BASE_URL}/api/favorites`, {
          productId
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setFavorites(prev => ({
          ...prev,
          [productId]: true
        }));

        toast.success("Added to favorites");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else {
        console.error('Failed to update favorites:', error);
        toast.error("Failed to update favorites");
      }
    }
  };

  const categories = ['all', ...new Set(products.map(product => product.category))];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Products</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="price-low-high">Price: Low to High</SelectItem>
              <SelectItem value="price-high-low">Price: High to Low</SelectItem>
              <SelectItem value="name-a-z">Name: A to Z</SelectItem>
              <SelectItem value="name-z-a">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const productId = product.id || product._id;
            const isFavorite = favorites[productId] || false;
            const isInCart = cartItems[productId]?.inCart || false;
            
            return (
              <div key={productId} className="product-card bg-white rounded-lg overflow-hidden shadow-md">
                <div 
                  className="h-48 overflow-hidden cursor-pointer" 
                  onClick={() => handleProductClick(product)}
                >
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
                
                <div className="p-4">
                  <h3 
                    className="text-lg font-semibold mb-2 hover:text-srblue transition-colors cursor-pointer" 
                    onClick={() => handleProductClick(product)}
                  >
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 capitalize">{product.category}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">₹{product.price.toFixed(2)}</span>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleFavorite(product)}
                        className={`${isFavorite ? 'text-red-500 border-red-500' : ''}`}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                      </Button>
                      
                      <Button
                        size="icon"
                        onClick={() => handleAddToCart(product)}
                        className={isInCart ? "bg-green-600" : ""}
                        title={isInCart ? "Already in cart" : "Add to cart"}
                      >
                        {isInCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {isInCart && (
                    <p className="text-green-600 text-sm mt-2">In your cart</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">No products found</h2>
          <p className="text-gray-500 mb-6">Try changing your search or filter criteria</p>
          <Button onClick={() => { 
            setSearchTerm(''); 
            setSelectedCategory('all');
            setSortBy('default');
            setSearchParams({});
          }}>
            Reset Filters
          </Button>
        </div>
      )}

      {/* Chatbot Widget */}
      <Widget
        title="Product Assistant"
        subtitle="Ask me about any product!"
        handleNewUserMessage={handleChatMessage}
      />
    </div>
  );
};

export default Products;