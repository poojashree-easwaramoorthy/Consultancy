import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'react-hot-toast'; // Add this import

/**
 * Service to handle cart operations with the server
 */
const cartService = {
  // Fetch the user's cart
  getCart: async (navigateCallback) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to view your cart");
      if (navigateCallback) navigateCallback("/login");
      return null;
    }

    try {
      console.log('Fetching cart from API...');
      
      // First try the ping endpoint to see if cart API is reachable
      try {
        await axios.get(`${API_BASE_URL}/api/ping/cart`);
        console.log('Cart API is reachable');
      } catch (pingError) {
        console.error('Cart API ping failed:', pingError);
      }

      const response = await axios.get(`${API_BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Cart fetched successfully:', response.data);
      
      // Store cart in localStorage as a backup
      try {
        localStorage.setItem('serverCart', JSON.stringify(response.data));
      } catch (e) {
        console.error('Failed to store cart in localStorage:', e);
      }
      
      // Ensure we have a properly structured cart
      if (response.data && typeof response.data === 'object') {
        if (!response.data.items) {
          console.warn('Server returned cart without items array, adding empty items array');
          response.data.items = [];
        }
        
        // Ensure each item has the required properties
        response.data.items = response.data.items.map(item => {
          const productData = item.productId || item;
          return {
            ...item,
            productId: productData._id || productData.id || item.productId,
            price: item.price || (productData && productData.price) || 0,
            name: item.name || (productData && productData.name) || 'Unknown Product',
            image: item.image || (productData && productData.image) || '',
            quantity: item.quantity || 1
          };
        });
        
        return response.data;
      }
      
      return { items: [] };
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      
      // Handle token expiration
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        if (navigateCallback) navigateCallback("/login");
      }
      
      // Try to get from localStorage if API fails
      try {
        const savedCart = localStorage.getItem('serverCart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          console.log('Retrieved cart from localStorage:', parsedCart);
          return parsedCart;
        }
      } catch (e) {
        console.error('Failed to retrieve cart from localStorage:', e);
      }
      
      toast.error("Failed to fetch cart. Please try again.");
      
      // Default empty cart
      return { items: [] };
    }
  },

  // Enhanced sync helper to better handle cart synchronization
  syncCartWithLocalStorage: (cart) => {
    try {
      if (cart) {
        // Writing cart to localStorage
        console.log('Saving cart to localStorage:', cart);
        localStorage.setItem('cartItems', JSON.stringify(cart));
        
        // Also store a timestamp to track freshness
        localStorage.setItem('cartItemsTimestamp', Date.now().toString());
        return true;
      } else {
        // Reading from localStorage
        const storedCart = localStorage.getItem('cartItems');
        const timestamp = localStorage.getItem('cartItemsTimestamp');
        
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          console.log('Retrieved cart from localStorage:', parsedCart, 
                      'Timestamp:', timestamp ? new Date(parseInt(timestamp)).toISOString() : 'unknown');
          return parsedCart;
        }
        return null;
      }
    } catch (error) {
      console.error('Error syncing cart with localStorage:', error);
      return null;
    }
  },

  // Add an item to the cart
  addToCart: async (product, quantity = 1, navigateCallback) => {
    try {
      console.log('Adding item to cart:', product, 'quantity:', quantity);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please login to add items to the cart");
        if (navigateCallback) navigateCallback("/login");
        return;
      }

      // Normalize product data to ensure consistent structure
      const productId = product._id || product.id;
      if (!productId) {
        console.error('Invalid product, no ID found:', product);
        throw new Error('Invalid product: missing ID');
      }

      const payload = {
        productId: productId,
        quantity: Number(quantity),
        price: Number(product.price || 0),
        name: product.name || 'Product',
        image: product.image || ''
      };

      console.log('Sending payload to server:', payload);
      const response = await axios.post(`${API_BASE_URL}/api/cart`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Server response from addToCart:', response.data);
      
      // Update localStorage backup
      try {
        localStorage.setItem('serverCart', JSON.stringify(response.data.cart));
      } catch (e) {
        console.error('Failed to update cart in localStorage:', e);
      }
      
      // Also update the localStorage backup for other components
      try {
        // Get current cart items from localStorage
        const storedCart = localStorage.getItem('cartItems');
        let cartItems = storedCart ? JSON.parse(storedCart) : [];
        
        // Check if product already exists
        const existingIndex = cartItems.findIndex(item => 
          (item.id || item._id) === (product.id || product._id)
        );
        
        if (existingIndex >= 0) {
          // Update quantity
          cartItems[existingIndex].quantity = (cartItems[existingIndex].quantity || 0) + quantity;
        } else {
          // Add new item
          cartItems.push({
            ...product,
            quantity: quantity
          });
        }
        
        // Save back to localStorage
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
      } catch (e) {
        console.error('Failed to update localStorage cart:', e);
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    }
  },

  // Update item quantity in the cart
  updateQuantity: async (productId, quantity) => {
    try {
      console.log(`Updating quantity for product ${productId} to ${quantity}`);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      // Fix: Handle productId properly regardless of format
      let normalizedProductId;
      
      if (!productId) {
        throw new Error('Invalid productId: value is undefined or null');
      }
      
      // Handle different productId formats safely
      if (typeof productId === 'object') {
        normalizedProductId = productId._id || productId.id;
        if (!normalizedProductId) {
          console.error('Product object lacks _id or id property:', productId);
          throw new Error('Invalid product object: missing ID');
        }
      } else {
        // If productId is already a string or primitive, use it directly
        normalizedProductId = productId;
      }

      console.log(`Normalized productId for update: ${normalizedProductId}`);
      
      const response = await axios.put(
        `${API_BASE_URL}/api/cart/${normalizedProductId}`, 
        { quantity: Number(quantity) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    }
  },

  // Remove an item from the cart
  removeFromCart: async (productId) => {
    try {
      console.log(`Removing product ${productId} from cart`);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      // Fix: Handle productId properly regardless of format
      let normalizedProductId;
      
      if (!productId) {
        throw new Error('Invalid productId: value is undefined or null');
      }
      
      // Handle different productId formats safely
      if (typeof productId === 'object') {
        normalizedProductId = productId._id || productId.id;
        if (!normalizedProductId) {
          console.error('Product object lacks _id or id property:', productId);
          throw new Error('Invalid product object: missing ID');
        }
      } else {
        // If productId is already a string or primitive, use it directly
        normalizedProductId = productId;
      }
      
      console.log(`Normalized productId for removal: ${normalizedProductId}`);

      const response = await axios.delete(
        `${API_BASE_URL}/api/cart/${normalizedProductId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      throw error;
    }
  },

  // Clear the entire cart
  clearCart: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await axios.delete(
        `${API_BASE_URL}/api/cart`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  }
};

export default cartService;
