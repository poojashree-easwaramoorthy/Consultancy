import { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import React from 'react';

const ProductContext = createContext();

// Default products
const defaultProducts = [
  { id: 1, name: "LED Bulb", price: 124.00, category: "lighting", description: "Energy-efficient LED bulb.", image: "/a.jpg", isFavorite: false, reviews: [] },
  { id: 2, name: "Extension Cord", price: 299.00, category: "wiring", description: "5-meter extension cord.", image: "/b.jpg", isFavorite: false, reviews: [] },
  { id: 3, name: "Smart Plug", price: 799.00, category: "switches", description: "Wi-Fi-enabled smart plug.", image: "/c.jpg", isFavorite: false, reviews: [] },
  { id: 4, name: "Circuit Breaker", price: 621.00, category: "safety", description: "High-quality circuit breaker for safety.", image: "/d.jpg", isFavorite: false, reviews: [] },
  { id: 5, name: "Solar Panel", price: 8999.00, category: "solar", description: "Eco-friendly solar panel for renewable energy.", image: "/e.jpg", isFavorite: false, reviews: [] },
  { id: 6, name: "Battery Backup", price: 1999.00, category: "safety", description: "Reliable battery backup for power outages.", image: "/f.jpg", isFavorite: false, reviews: [] },
  { id: 7, name: "Voltage Stabilizer", price: 2300.00, category: "safety", description: "Stabilizes voltage to protect appliances.", image: "/g.jpg", isFavorite: false, reviews: [] },
  { id: 8, name: "Electric Drill", price: 1300.00, category: "tools", description: "Powerful electric drill for DIY projects.", image: "/h.jpg", isFavorite: false, reviews: [] },
  { id: 9, name: "Cable Tester", price: 1575.00, category: "tools", description: "Tests electrical cables for faults.", image: "/i.jpg", isFavorite: false, reviews: [] },
  { id: 10, name: "LED Strip Lights", price: 1099.00, category: "lighting", description: "Flexible LED strip lights for decoration.", image: "/j.jpg", isFavorite: false, reviews: [] },
];

// Default admin user
const defaultUsers = [
  { 
    id: 1,
    name: "Admin User", 
    email: "admin@example.com", 
    isAdmin: true,
    dateJoined: new Date().toISOString()
  }
];

export const ProductProvider = ({ children, navigateCallback }) => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [allCarts, setAllCarts] = useState([]); // Store all user carts
  const [allFavorites, setAllFavorites] = useState([]); // Store all user favorites
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [users, setUsers] = useState(defaultUsers);
  const [currentReview, setCurrentReview] = useState({ productId: null, rating: 0, comment: '' });
  const [savedPaymentMethods, setSavedPaymentMethods] = useState({
    cards: [],
    upi: []
  });
  const [storeSettings, setStoreSettings] = useState({
    storeName: "SR Electricals",
    storeEmail: "info@srelectricals.com",
    storePhone: "+91 9876543210",
    enableCod: true,
    enableRazorpay: true,
    enableUpi: true,
    razorpayKey: "rzp_test_pYO1RxhwzDCppY"
  });
  const [loading, setLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    const savedAllCarts = localStorage.getItem('allCarts');
    const savedAllFavorites = localStorage.getItem('allFavorites');
    const savedUser = localStorage.getItem('user');
    const savedOrders = localStorage.getItem('orders');
    const savedProducts = localStorage.getItem('products');
    const savedAddresses = localStorage.getItem('addresses');
    const savedPaymentMethodsData = localStorage.getItem('savedPaymentMethods');
    const savedStoreSettings = localStorage.getItem('storeSettings');
    const savedUsers = localStorage.getItem('users');
    
    if (savedAllCarts) setAllCarts(JSON.parse(savedAllCarts));
    if (savedAllFavorites) setAllFavorites(JSON.parse(savedAllFavorites));
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedAddresses) setAddresses(JSON.parse(savedAddresses));
    if (savedPaymentMethodsData) setSavedPaymentMethods(JSON.parse(savedPaymentMethodsData));
    if (savedStoreSettings) setStoreSettings(JSON.parse(savedStoreSettings));
    if (savedUsers) setUsers(JSON.parse(savedUsers));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (allCarts.length > 0) localStorage.setItem('allCarts', JSON.stringify(allCarts));
    if (allFavorites.length > 0) localStorage.setItem('allFavorites', JSON.stringify(allFavorites));
    if (user) localStorage.setItem('user', JSON.stringify(user));
    if (orders.length > 0) localStorage.setItem('orders', JSON.stringify(orders));
    if (addresses.length > 0) localStorage.setItem('addresses', JSON.stringify(addresses));
    if (savedPaymentMethods.cards.length > 0 || savedPaymentMethods.upi.length > 0) {
      localStorage.setItem('savedPaymentMethods', JSON.stringify(savedPaymentMethods));
    }
    
    // Always save these to ensure they're persisted
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('storeSettings', JSON.stringify(storeSettings));
    localStorage.setItem('users', JSON.stringify(users));
  }, [allCarts, allFavorites, user, orders, products, addresses, savedPaymentMethods, storeSettings, users]);

  // Get current user's cart
  const cart = useMemo(() => {
    if (!user) return [];
    return allCarts.find(cart => cart.userId === user.id)?.items || [];
  }, [allCarts, user]);

  // Get current user's favorites
  const favorites = useMemo(() => {
    if (!user) return [];
    return allFavorites.find(fav => fav.userId === user.id)?.items || [];
  }, [allFavorites, user]);

  const addToCart = useCallback((product) => {
    if (!isLoggedIn) {
      toast({
        title: "Please login first",
        description: "You need to login before adding items to cart",
        variant: "destructive",
      });
      return;
    }

    setAllCarts(currentAllCarts => {
      // Find the user's cart
      const userCartIndex = currentAllCarts.findIndex(cart => cart.userId === user.id);
      
      if (userCartIndex >= 0) {
        // User has a cart, update it
        const userCart = currentAllCarts[userCartIndex];
        const existingItemIndex = userCart.items.findIndex(item => item.id === product.id);
        
        const updatedUserCart = { ...userCart };
        
        if (existingItemIndex >= 0) {
          // Product exists in cart, update quantity
          updatedUserCart.items = userCart.items.map(item => 
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          // Add new product to cart
          updatedUserCart.items = [...userCart.items, { ...product, quantity: 1 }];
        }
        
        // Return updated carts
        return [
          ...currentAllCarts.slice(0, userCartIndex),
          updatedUserCart,
          ...currentAllCarts.slice(userCartIndex + 1)
        ];
      } else {
        // Create new cart for user
        return [
          ...currentAllCarts,
          {
            userId: user.id,
            items: [{ ...product, quantity: 1 }]
          }
        ];
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  }, [isLoggedIn, toast, user]);

  // Remove from cart
  const removeFromCart = useCallback((productId) => {
    setAllCarts(currentAllCarts => {
      // Find the user's cart
      const userCartIndex = currentAllCarts.findIndex(cart => cart.userId === user.id);
      
      if (userCartIndex >= 0) {
        // User has a cart, update it
        const userCart = currentAllCarts[userCartIndex];
        const updatedItems = userCart.items.filter(item => item.id !== productId);
        
        const updatedUserCart = { 
          ...userCart,
          items: updatedItems
        };
        
        // Return updated carts
        return [
          ...currentAllCarts.slice(0, userCartIndex),
          updatedUserCart,
          ...currentAllCarts.slice(userCartIndex + 1)
        ];
      }
      
      return currentAllCarts;
    });
    
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
    });
  }, [toast, user]);

  // Update cart item quantity
  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setAllCarts(currentAllCarts => {
      // Find the user's cart
      const userCartIndex = currentAllCarts.findIndex(cart => cart.userId === user.id);
      
      if (userCartIndex >= 0) {
        // User has a cart, update it
        const userCart = currentAllCarts[userCartIndex];
        const updatedItems = userCart.items.map(item => 
          item.id === productId ? { ...item, quantity: newQuantity } : item
        );
        
        const updatedUserCart = { 
          ...userCart,
          items: updatedItems
        };
        
        // Return updated carts
        return [
          ...currentAllCarts.slice(0, userCartIndex),
          updatedUserCart,
          ...currentAllCarts.slice(userCartIndex + 1)
        ];
      }
      
      return currentAllCarts;
    });
  }, [user]);

  // Toggle favorite
  const toggleFavorite = useCallback((productId) => {
    if (!isLoggedIn) {
      toast({
        title: "Please login first",
        description: "You need to login before adding favorites",
        variant: "destructive",
      });
      return;
    }
    
    // Get the product to toggle
    const productToToggle = products.find(p => p.id === productId);
    if (!productToToggle) return;
    
    setAllFavorites(currentAllFavorites => {
      // Find user's favorites list
      const userFavsIndex = currentAllFavorites.findIndex(fav => fav.userId === user.id);
      
      if (userFavsIndex >= 0) {
        // User has favorites, update them
        const userFavs = currentAllFavorites[userFavsIndex];
        const existingItemIndex = userFavs.items.findIndex(item => item.id === productId);
        
        const updatedUserFavs = { ...userFavs };
        
        if (existingItemIndex >= 0) {
          // Remove from favorites
          updatedUserFavs.items = userFavs.items.filter(item => item.id !== productId);
          
          toast({
            title: "Removed from favorites",
            description: "Item has been removed from your favorites.",
          });
        } else {
          // Add to favorites
          updatedUserFavs.items = [...userFavs.items, productToToggle];
          
          toast({
            title: "Added to favorites",
            description: "Item has been added to your favorites.",
          });
        }
        
        // Return updated favorites
        return [
          ...currentAllFavorites.slice(0, userFavsIndex),
          updatedUserFavs,
          ...currentAllFavorites.slice(userFavsIndex + 1)
        ];
      } else {
        // Create new favorites for user
        toast({
          title: "Added to favorites",
          description: "Item has been added to your favorites.",
        });
        
        return [
          ...currentAllFavorites,
          {
            userId: user.id,
            items: [productToToggle]
          }
        ];
      }
    });
    
    // Update isFavorite flag in products
    setProducts(currentProducts => currentProducts.map(product => 
      product.id === productId 
        ? { ...product, isFavorite: !product.isFavorite } 
        : product
    ));
  }, [isLoggedIn, toast, products, user]);

  // Login function
  const login = useCallback((userData) => {
    // Check if user already exists
    const existingUser = users.find(u => u.email === userData.email);
    
    if (!existingUser) {
      // If user doesn't exist, create new user
      const newUser = {
        ...userData,
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        dateJoined: new Date().toISOString()
      };
      
      setUsers(currentUsers => [...currentUsers, newUser]);
      setUser(newUser);
    } else {
      // Use existing user data
      setUser(existingUser);
    }
    
    setIsLoggedIn(true);
    toast({
      title: "Login successful",
      description: `Welcome back, ${userData.name}!`,
    });
  }, [toast, users]);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  }, [toast]);

  // Get user-specific orders
  const getUserOrders = useCallback(() => {
    if (!user) return [];
    return orders.filter(order => order.userId === user.id);
  }, [orders, user]);

  // Get user-specific addresses
  const getUserAddresses = useCallback(() => {
    if (!user) return [];
    return addresses.filter(address => address.userId === user.id);
  }, [addresses, user]);

  // Add address - Updated to ensure it's properly saved and returned
  const addUserAddress = useCallback((address) => {
    if (!user) {
      toast({
        title: "Please login first",
        description: "You need to login to add addresses",
        variant: "destructive",
      });
      return null;
    }

    // Check if this address is already saved (prevent duplicates)
    const isDuplicate = addresses.some(a => 
      a.userId === user.id && 
      a.street === address.street && 
      a.city === address.city && 
      a.pincode === address.pincode
    );

    if (isDuplicate) {
      // Return the existing address instead of creating a duplicate
      const existingAddress = addresses.find(a => 
        a.userId === user.id && 
        a.street === address.street && 
        a.city === address.city && 
        a.pincode === address.pincode
      );
      
      toast({
        title: "Address already saved",
        description: "This address is already in your profile",
      });
      return existingAddress;
    }

    const newAddress = {
      id: Date.now(),
      userId: user.id,
      ...address
    };

    setAddresses(currentAddresses => [...currentAddresses, newAddress]);
    
    toast({
      title: "Address added",
      description: "Your address has been saved to your profile",
    });
    
    return newAddress;
  }, [user, addresses, toast]);

  // Updated to save payment methods with userId and prevent duplicates
  const savePaymentMethod = useCallback((type, method) => {
    if (!user) {
      toast({
        title: "Please login first",
        description: "You need to login to save payment methods",
        variant: "destructive",
      });
      return;
    }
    setSavedPaymentMethods(current => {
      if (type === 'card') {
        // Check for duplicate cards (by last 4 digits)
        const lastFour = method.number.slice(-4);
        const isDuplicate = current.cards.some(
          card => card.userId === user.id && card.number.slice(-4) === lastFour
        );
        if (isDuplicate) {
          toast({
            title: "Card already saved",
            description: "This card is already saved in your profile",
          });
          return current;
        }
        return {
          ...current,
          cards: [...current.cards, { ...method, id: Date.now(), userId: user.id }]
        };
      } else if (type === 'upi') {
        // Check for duplicate UPI IDs
        const isDuplicate = current.upi.some(
          upi => upi.userId === user.id && upi.upiId === method
        );
        if (isDuplicate) {
          toast({
            title: "UPI already saved",
            description: "This UPI ID is already saved in your profile",
          });
          return current;
        }
        return {
          ...current,
          upi: [...current.upi, { id: Date.now(), upiId: method, userId: user.id }]
        };
      }
      return current;
    });
    toast({
      title: "Payment method saved",
      description: `Your ${type} has been saved for future use.`,
    });
  }, [toast, user]);

  // Update to only remove user's own payment methods
  const removePaymentMethod = useCallback((type, id) => {
    if (!user) return;
    setSavedPaymentMethods(current => {
      if (type === 'card') {
        return {
          ...current,
          cards: current.cards.filter(card => !(card.id === id && card.userId === user.id))
        };
      } else if (type === 'upi') {
        return {
          ...current,
          upi: current.upi.filter(upi => !(upi.id === id && upi.userId === user.id))
        };
      }
      return current;
    });
    toast({
      title: "Payment method removed",
      description: `Your ${type} has been removed.`,
    });
  }, [toast, user]);

  // Add review to product
  const addReview = useCallback((productId, review) => {
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        const newReview = {
          id: Date.now(),
          userId: user.id,
          userName: user.name,
          ...review,
          date: new Date().toISOString()
        };
        return {
          ...product,
          reviews: [...product.reviews, newReview]
        };
      }
      return product;
    });
    setProducts(updatedProducts);
    toast({
      title: "Review added",
      description: "Your review has been added successfully.",
    });
  }, [products, toast, user]);

  // Update existing review
  const updateReview = useCallback((productId, reviewId, updatedReview) => {
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        const updatedReviews = product.reviews.map(review =>
          review.id === reviewId ? { ...review, ...updatedReview } : review
        );
        return {
          ...product,
          reviews: updatedReviews
        };
      }
      return product;
    });
    setProducts(updatedProducts);
    toast({
      title: "Review updated",
      description: "Your review has been updated successfully.",
    });
  }, [products, toast]);

  // Place an order - Update to not clear cart after order
  const placeOrder = useCallback(async (orderDetails, buyNowItems = null) => {
    const orderItems = buyNowItems || [...cart];
    // Calculate total based on provided items
    const orderTotal = orderItems.reduce((sum, item) => {
      const itemPrice = item.price;
      const itemQuantity = item.quantity || 1; // Default to 1 if quantity is not specified
      return sum + (itemPrice * itemQuantity);
    }, 0);
    // Calculate shipping
    const shipping = orderTotal >= 1000 ? 0 : 100;

    const newOrder = {
      id: Date.now(),
      userId: user.id,
      items: orderItems,
      total: orderTotal + shipping,
      shipping: shipping,
      status: 'Processing',
      date: new Date().toISOString(),
      ...orderDetails
    };
    setOrders(currentOrders => [...currentOrders, newOrder]);
    // Removed the code that clears the cart after placing an order
    toast({
      title: "Order placed",
      description: "Your order has been placed successfully!",
    });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/place-order', newOrder, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh orders list after placing order
      await fetchOrders();
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }, [cart, toast, user]);

  // Calculate cart total
  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  // Get cart item count
  const getCartItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // Update store settings
  const updateStoreSettings = useCallback((newSettings) => {
    setStoreSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings,
    }));
    // Immediately save to localStorage for persistence
    localStorage.setItem('storeSettings', JSON.stringify({
      ...storeSettings,
      ...newSettings,
    }));
    toast({
      title: "Store settings updated",
      description: "Your store settings have been updated successfully.",
    });
  }, [toast, storeSettings]);

  // Update user profile - fixed to properly save and update user profile
  const updateUserProfile = useCallback((userData) => {
    if (!userData || !user) {
      toast({
        title: "Error updating profile",
        description: "Unable to update profile information",
        variant: "destructive",
      });
      return null;
    }
    // Update current user
    const updatedUser = { 
      ...user, 
      ...userData,
      // Ensure these critical fields are preserved
      id: user.id,
      dateJoined: user.dateJoined,
      isAdmin: user.isAdmin,
    };
    setUser(updatedUser);
    // Update in users list
    const updatedUsers = users.map(u => 
      u.id === user.id ? updatedUser : u
    );
    setUsers(updatedUsers);
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
    // Save to local storage immediately
    localStorage.setItem('user', JSON.stringify(updatedUser));
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    return updatedUser;
  }, [user, users, toast]);

  // Fetch orders
  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to view your orders");
      handleUnauthorized();
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOrders(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        handleUnauthorized();
      } else {
        console.error("Error fetching orders:", error);
        toast.error("Failed to fetch orders. Please try again.");
      }
    }
  };

  // Fetch addresses
  const fetchAddresses = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to view your addresses");
      handleUnauthorized();
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAddresses(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        handleUnauthorized();
      } else {
        console.error("Error fetching addresses:", error);
        toast.error("Failed to fetch addresses. Please try again.");
      }
    }
  };

  // Enhanced product management functions
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      console.log('Fetched products:', response.data); // Add debug logging
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to default products on error
      setProducts(defaultProducts);
      toast({
        title: "Error loading products",
        description: "Using default product list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProductById = async (productId) => {
    try {
      // Check if productId is undefined or null
      if (!productId || productId === "undefined" || productId === "null") {
        console.error("Invalid product ID provided:", productId);
        toast({
          title: "Error",
          description: "Invalid product ID",
          variant: "destructive",
        });
        return null;
      }
      
      // First check if product is already in local state
      const localProduct = products.find(p => 
        p.id?.toString() === productId?.toString() || 
        p._id?.toString() === productId?.toString()
      );
      
      if (localProduct) {
        return localProduct;
      }
      
      // If not found locally, fetch from API
      setLoading(true);
      console.log(`Attempting to fetch product with ID: ${productId}`);
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/products/${productId}`);
        
        if (response.data) {
          console.log(`Successfully fetched product:`, response.data);
          
          // Add the fetched product to local state
          setProducts(currentProducts => {
            const exists = currentProducts.some(p => 
              p.id?.toString() === response.data.id?.toString() || 
              p._id?.toString() === response.data._id?.toString()
            );
            
            if (!exists) {
              return [...currentProducts, response.data];
            }
            return currentProducts;
          });
          
          return response.data;
        }
      } catch (fetchError) {
        console.error(`Error fetching product ${productId}:`, fetchError);
        
        // If API fails, try to find a product in our default products
        const fallbackProduct = defaultProducts.find(p => p.id?.toString() === productId?.toString());
        
        if (fallbackProduct) {
          console.log(`Using fallback product from default list:`, fallbackProduct);
          return fallbackProduct;
        }
      }
      
      toast({
        title: "Product not found",
        description: "The requested product could not be found",
        variant: "destructive",
      });
      return null;
    } catch (error) {
      console.error('Error in getProductById:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (productData) => {
    try {
      setLoading(true);
      console.log('Adding product to:', `${API_BASE_URL}/api/admin/products`); // Add debug logging
      console.log('Product data:', productData); // Log the data being sent
      
      const response = await axios.post(`${API_BASE_URL}/api/admin/products`, productData);
      console.log('Product added response:', response.data); // Add debug logging
      
      // Refresh product list after adding
      await fetchProducts();
      toast({
        title: "Product added",
        description: "Product has been added successfully",
      });
      return response.data;
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error adding product",
        description: error.response?.data?.message || "Could not add the product",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId, productData) => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_BASE_URL}/api/admin/products/${productId}`, productData);
      // Refresh product list after updating
      await fetchProducts();
      toast({
        title: "Product updated",
        description: "Product has been updated successfully",
      });
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error updating product",
        description: error.response?.data?.message || "Could not update the product",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/api/admin/products/${productId}`);
      // Refresh product list after deleting
      await fetchProducts();
      toast({
        title: "Product deleted",
        description: "Product has been removed successfully",
      });
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error deleting product",
        description: error.response?.data?.message || "Could not delete the product",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchAddressesLocal = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get('http://localhost:5000/api/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const addAddress = async (addressData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(addressData)
      });

      if (!response.ok) {
        throw new Error('Failed to add address');
      }

      const newAddress = await response.json();
      setAddresses((prevAddresses) => [...prevAddresses, newAddress]);

      toast({
        title: "Success",
        description: "Address added successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error adding address:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add address.",
        variant: "destructive"
      });
    }
  };

  // Helper method to get product details for navigation
  const prepareProductDetailNavigation = useCallback((productId) => {
    const product = products.find(p => 
      p.id?.toString() === productId?.toString() || 
      p._id?.toString() === productId?.toString()
    );
    return product || null;
  }, [products]);

  // Helper method to prepare checkout navigation data
  const prepareCheckoutNavigation = useCallback((productId, quantity = 1, buyNow = true) => {
    if (!productId) {
      console.error("Invalid product ID for checkout:", productId);
      toast({
        title: "Invalid product",
        description: "Cannot find the product information",
        variant: "destructive",
      });
      return null;
    }
  
    console.log(`Preparing checkout for product ID: ${productId}, quantity: ${quantity}`);
    
    // First try to find the product using MongoDB _id or regular id
    const product = products.find(p => {
      if (!p) return false;
      
      const productIdStr = productId?.toString() || '';
      const pIdStr = p.id?.toString() || '';
      const pMongoIdStr = p._id?.toString() || '';
      
      return pIdStr === productIdStr || pMongoIdStr === productIdStr;
    });
    
    if (!product) {
      console.error(`Product not found for checkout. ID: ${productId}`, 
        { searchId: productId, availableProducts: products.map(p => ({ id: p.id, _id: p._id })) });
      
      toast({
        title: "Product not found",
        description: "Unable to find the requested product",
        variant: "destructive",
      });
      return null;
    }
  
    console.log(`Found product for checkout:`, product);
    
    // Create a clean copy of the product with quantity
    const checkoutProduct = {
      ...product,
      quantity: quantity
    };
    
    return {
      buyNow,
      product: checkoutProduct
    };
  }, [products, toast]);

  // Clear cart function
  const clearCart = useCallback(() => {
    if (!user) return;
    
    setAllCarts(currentAllCarts => {
      const userCartIndex = currentAllCarts.findIndex(cart => cart.userId === user.id);
      
      if (userCartIndex >= 0) {
        return [
          ...currentAllCarts.slice(0, userCartIndex),
          { ...currentAllCarts[userCartIndex], items: [] },
          ...currentAllCarts.slice(userCartIndex + 1)
        ];
      }
      return currentAllCarts;
    });
    
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
    });
  }, [user, toast]);

  // Navigation handler for unauthorized access
  const handleUnauthorized = () => {
    if (navigateCallback) {
      navigateCallback("/login");
    } else {
      console.error("Navigation callback is not provided.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
    } else {
      setOrders([]); // Clear orders when user logs out
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAddresses();
    } else {
      setAddresses([]);
    }
  }, [isLoggedIn]);

  const contextValue = {
    products,
    setProducts,
    cart,
    favorites,
    user,
    orders: getUserOrders(), // Return only user's orders
    setOrders,
    isLoggedIn,
    addresses: getUserAddresses(), // Return only user's addresses
    currentReview,
    setCurrentReview,
    savedPaymentMethods,
    storeSettings,
    users,
    setUsers,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleFavorite,
    login,
    logout,
    addReview,
    updateReview,
    placeOrder,
    addAddress,
    getCartTotal,
    getCartItemCount,
    savePaymentMethod,
    removePaymentMethod,
    updateStoreSettings,
    updateUserProfile,
    fetchOrders, // Add this
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    loading,
    addresses,
    fetchAddresses, // keep the main fetchAddresses for context consumers
    prepareProductDetailNavigation,
    prepareCheckoutNavigation,
    clearCart,
    fetchAddressesLocal // optionally export the local version if needed
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};

