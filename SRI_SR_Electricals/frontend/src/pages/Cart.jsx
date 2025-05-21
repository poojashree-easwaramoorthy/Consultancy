import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProduct } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import cartService from '@/services/cartService';
import { toast } from 'react-hot-toast';

const Cart = () => {
  // Check if any cart-related functions are available in the context
  const { 
    cart: localCart, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal, 
    isLoggedIn, 
    storeSettings,
    // Try different potential method names for updating cart state
    setCart: contextSetCart,
    updateCart,
    syncCart
  } = useProduct();
  
  // Enhanced context management with a more robust approach
  const updateContextCart = useCallback((items) => {
    console.log('Attempting to update cart in context');
    try {
      // Try direct methods first
      if (typeof contextSetCart === 'function') {
        console.log('Using setCart method');
        contextSetCart(items);
        return true;
      } else if (typeof updateCart === 'function') {
        console.log('Using updateCart method');
        updateCart(items);
        return true;
      } else if (typeof syncCart === 'function') {
        console.log('Using syncCart method');
        syncCart(items);
        return true;
      }
      
      // If direct methods failed, try fallback strategies
      console.log('Attempting direct cart mutation');
      
      // Store in localStorage as a reliable fallback
      cartService.syncCartWithLocalStorage(items);
      console.log('Cart saved to localStorage');
      
      // Try a more reliable way to update localCart if it's an array
      if (Array.isArray(localCart)) {
        try {
          // Create a safety check to avoid React errors
          const safeUpdate = () => {
            // Clear existing items
            while (localCart.length > 0) {
              localCart.pop();
            }
            
            // Add new items
            if (Array.isArray(items)) {
              items.forEach(item => {
                if (item) localCart.push({...item});
              });
            }
          };
          
          // Execute the update
          safeUpdate();
          console.log('Successfully updated localCart directly');
          return true;
        } catch (err) {
          console.error('Error during direct cart mutation:', err);
        }
      }
      
      console.log('No context method available to update cart');
      return false;
    } catch (err) {
      console.error('Error updating context cart:', err);
      return false;
    }
  }, [contextSetCart, updateCart, syncCart, localCart]);
      
  const [serverCart, setServerCart] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [forceRefresh, setForceRefresh] = useState(0);

  // Check if there are any payment methods enabled
  const anyPaymentMethodEnabled = storeSettings?.enableCod || storeSettings?.enableRazorpay || storeSettings?.enableUpi;

  // Improve the useEffect to be more resilient with cart updates
  useEffect(() => {
    if (isLoggedIn) {
      console.log('User is logged in, fetching cart data');
      fetchCart();
    } else {
      console.log('User is not logged in, using local cart');
      setServerCart({ items: [] });
    }
    
    // Store a copy of the cart in localStorage as a fallback
    if (Array.isArray(localCart) && localCart.length > 0) {
      try {
        localStorage.setItem('localCartBackup', JSON.stringify(localCart));
      } catch (e) {
        console.error('Failed to store local cart backup:', e);
      }
    }
  }, [isLoggedIn, forceRefresh]);

  // Enhanced fetchCart function with improved error handling and fallbacks
  const fetchCart = async () => {
    if (!isLoggedIn) return;

    console.log('Fetching cart data from server');
    try {
      setIsLoading(true);
      setError(null);

      const result = await cartService.getCart();
      console.log('Cart fetched from server:', result);
      
      // Always update server cart state
      setServerCart(result);
      
      if (!result || !result.items) {
        console.warn('Invalid cart data received:', result);
        return;
      }
      
      // Process cart items format for consistent structure
      const processedItems = (result.items || []).map(item => {
        // Get product data from either populated object or direct properties
        const product = item.productId || item;
        const productId = product._id || product.id || item.productId;
        
        // Build a clean cart item object with all needed properties
        return {
          ...(typeof product === 'object' ? product : {}),
          id: productId,
          _id: productId,
          quantity: item.quantity || 1,
          price: item.price || (product && product.price) || 0,
          name: item.name || (product && product.name) || 'Unknown Product',
          image: item.image || (product && product.image) || ''
        };
      });
      
      console.log('Syncing server cart with local context:', processedItems);
      
      // Try multiple update approaches for maximum reliability
      const updated = updateContextCart(processedItems);
      
      if (!updated) {
        console.log('Could not update context cart, using local state only');
        // Always store in localStorage as a fallback
        try {
          localStorage.setItem('cartBackup', JSON.stringify(processedItems));
          console.log('Saved cart items to localStorage as backup');
          
          // If we have window events, dispatch one to notify other components
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('cartUpdated', { 
              detail: { items: processedItems } 
            }));
            console.log('Dispatched cartUpdated event');
          }
        } catch (e) {
          console.error('Failed to save cart items to localStorage:', e);
        }
      }
    } catch (error) {
      console.error('Failed to fetch cart from server:', error);
      setError('Could not load your cart. Please try again.');
      toast.error('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total from server cart items
  const calculateServerCartTotal = () => {
    if (!serverCart || !serverCart.items || serverCart.items.length === 0) {
      return 0;
    }
    
    return serverCart.items.reduce((total, item) => {
      const price = item.productId?.price || item.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  // Handle quantity change with server sync
  const handleQuantityChange = async (productId, newQuantity) => {
    // Don't allow quantities less than 1
    if (newQuantity < 1) return;

    console.log(`Updating quantity for product ${productId} to ${newQuantity}`);
    try {
      // Ensure productId is valid
      if (!productId) {
        console.error('Invalid product ID for quantity update');
        toast.error('Error updating quantity: Invalid product');
        return;
      }

      // Update local state immediately for responsiveness
      if (typeof updateQuantity === 'function') {
        updateQuantity(productId, newQuantity);
      }
      
      if (isLoggedIn) {
        // Update on server
        await cartService.updateQuantity(productId, newQuantity);
        toast.success('Quantity updated');
        
        // Refresh cart from server to ensure consistency
        fetchCart();
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error('Failed to update quantity');
      // Rollback UI changes if server update fails
      fetchCart();
    }
  };

  // Handle item removal with server sync
  const handleRemoveItem = async (productId) => {
    try {
      // Ensure productId is valid
      if (!productId) {
        console.error('Invalid product ID for removal');
        toast.error('Error removing item: Invalid product');
        return;
      }

      // Update local state immediately
      if (typeof removeFromCart === 'function') {
        removeFromCart(productId);
      }
      
      if (isLoggedIn) {
        await cartService.removeFromCart(productId);
        toast.success('Item removed from cart');
        
        // Refresh cart after removal
        fetchCart();
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error('Failed to remove item');
    }
  };

  // Redirect to checkout
  const handleCheckout = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/cart' } });
    } else {
      // Calculate shipping cost
      const subtotal = parseFloat(cartTotal.toFixed(2));
      const shippingCost = subtotal >= 1000 ? 0 : 100;
      const totalAmount = subtotal + shippingCost;
      
      console.log('Checkout summary:', {
        subtotal: subtotal,
        shippingCost: shippingCost,
        totalAmount: totalAmount
      });
      
      // Normalize cart items for consistent structure in checkout
      const normalizedItems = displayCart.items.map(item => {
        // Extract product info based on whether it's from server or local cart
        const product = isLoggedIn ? item.productId || item : item;
        const quantity = Number(item.quantity || 1);
        
        // Ensure we have a valid productId
        const productId = product._id || product.id || item.productId;
        const price = Number(product.price || item.price || 0);
        
        return {
          id: productId,
          productId: productId,
          name: product.name || item.name || 'Product',
          price: price,
          quantity: quantity,
          image: product.image || item.image || '',
          total: parseFloat((price * quantity).toFixed(2)),
        };
      });
      
      // Pass cart data to checkout page
      navigate('/checkout', {
        state: {
          cartItems: normalizedItems,
          summary: {
            subtotal: subtotal,
            shippingCost: shippingCost,
            totalAmount: totalAmount
          },
          fromCart: true
        }
      });
    }
  };

  // Determine which cart data to display - prioritize server cart when logged in
  const cartItems = isLoggedIn && serverCart?.items 
    ? serverCart.items 
    : localCart || [];
    
  const displayCart = { items: Array.isArray(cartItems) ? cartItems : [] };
  const cartTotal = isLoggedIn && serverCart ? calculateServerCartTotal() : getCartTotal();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-gray-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-4">Loading your cart...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
          <ShoppingBag className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <Button onClick={fetchCart} className="bg-srblue hover:bg-blue-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!isLoading && (!displayCart.items || displayCart.items.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any products to your cart yet.</p>
          <Link to="/products">
            <Button className="bg-srblue hover:bg-blue-700">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isDevEnvironment = process.env.NODE_ENV === 'development';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Shopping Cart</h1>
      
      {isLoggedIn && (
        <div className="flex justify-end mb-4 space-x-2">
          <Button 
            variant="outline" 
            onClick={fetchCart} 
            className="flex items-center" 
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Cart
          </Button>
          
          {isDevEnvironment && (
            <Button
              variant="secondary"
              onClick={() => setForceRefresh(prev => prev + 1)}
              className="text-xs"
              size="sm"
            >
              Force Refresh
            </Button>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Cart Items ({displayCart.items.length})</h2>
            </div>
            
            <div className="divide-y">
              {displayCart.items.map((item) => {
                // Extract product info based on whether it's from server or local cart
                const product = isLoggedIn ? item.productId || item : item;
                const quantity = item.quantity || 1;
                
                // Fix: Ensure we have a valid productId in string format
                let productId;
                if (product && (product._id || product.id)) {
                  productId = product._id || product.id;
                } else if (item.productId && typeof item.productId === 'string') {
                  productId = item.productId;
                } else {
                  console.warn('Item with missing or invalid productId:', item);
                  productId = item._id || item.id || 'unknown-product';
                }
                
                const price = product.price || item.price;
                const image = product.image || item.image;
                const name = product.name || item.name;
                const category = product.category || '';
                
                return (
                  <div key={productId} className="p-6 flex flex-col sm:flex-row items-center">
                    {/* Item Image */}
                    <div className="w-24 h-24 flex-shrink-0 mr-6 mb-4 sm:mb-0">
                      <img 
                        src={image} 
                        alt={name} 
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/200/e2e8f0/1e293b?text=SR+Electricals';
                        }}
                      />
                    </div>
                    
                    {/* Item Details */}
                    <div className="flex-grow">
                      <Link to={`/products/${productId}`}>
                        <h3 className="text-lg font-medium mb-1 hover:text-srblue transition-colors">{name}</h3>
                      </Link>
                      <p className="text-gray-500 text-sm mb-2 capitalize">{category}</p>
                      <div className="flex flex-wrap justify-between items-center">
                        <span className="font-semibold">₹{price.toFixed(2)}</span>
                        
                        <div className="flex items-center mt-2 sm:mt-0">
                          <button 
                            className="bg-gray-200 px-3 py-1 rounded-l-md hover:bg-gray-300"
                            onClick={() => handleQuantityChange(productId, quantity - 1)}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(productId, parseInt(e.target.value))}
                            className="w-12 text-center border-y border-gray-200 py-1"
                          />
                          <button 
                            className="bg-gray-200 px-3 py-1 rounded-r-md hover:bg-gray-300"
                            onClick={() => handleQuantityChange(productId, quantity + 1)}
                          >
                            +
                          </button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(productId)}
                            className="ml-4 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₹{cartTotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">
                  {cartTotal >= 1000 ? 'Free' : '₹100.00'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">
                  ₹{(cartTotal + (cartTotal >= 1000 ? 0 : 100)).toFixed(2)}
                </span>
              </div>
              
              {anyPaymentMethodEnabled ? (
                <Button onClick={handleCheckout} className="w-full bg-srblue hover:bg-blue-700 mt-6">
                  {isLoggedIn ? 'Proceed to Checkout' : 'Login to Checkout'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  <p className="text-sm font-medium">Checkout is currently unavailable. Please contact the store administrator.</p>
                </div>
              )}

              {/* Available Payment Methods */}
              {isLoggedIn && anyPaymentMethodEnabled && (
                <div className="mt-4 text-sm text-gray-600">
                  <p className="mb-2 font-medium">Available Payment Methods:</p>
                  <ul className="space-y-1">
                    {storeSettings?.enableCod && (
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Cash on Delivery
                      </li>
                    )}
                    {storeSettings?.enableRazorpay && (
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Credit/Debit Cards
                      </li>
                    )}
                    {storeSettings?.enableUpi && (
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        UPI Payment
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;