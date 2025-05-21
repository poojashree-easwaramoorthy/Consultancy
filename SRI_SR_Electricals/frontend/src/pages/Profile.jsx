import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useProduct } from '@/context/ProductContext';
import { 
  Package, User, MapPin, Gift, CreditCard, Star, Tag, Heart, LogOut, AlertCircle, Plus, Trash2, ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '@/config/api'; // Add this import
import axios from 'axios';

const Profile = () => {
  const { section } = useParams();
  const { 
    isLoggedIn, 
    user, 
    logout, 
    orders: contextOrders,
    loading: contextLoading,
    fetchOrders: contextFetchOrders,
    products = [], // Add default empty array
    addresses = [], // Add default empty array
    addAddress,
    fetchAddresses, // Add this
    addToCart, // Add this to access the addToCart function
  } = useProduct();
  
  // Add state variables for direct API fetching
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form states
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isUpiDialogOpen, setIsUpiDialogOpen] = useState(false);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUpi, setNewUpi] = useState('');
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    dob: ''
  });

  // Redirect to login if not logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Handle tab selection
  const selectedTab = section || 'orders';
  
  // Function to fetch orders directly from API
  const fetchUserOrders = async () => {
    if (!isLoggedIn) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/orders/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      
      // Ensure we don't have duplicates by using a Map with order ID as key
      const uniqueOrders = new Map();
      data.forEach(order => {
        const orderId = order._id || order.id;
        if (!uniqueOrders.has(orderId)) {
          uniqueOrders.set(orderId, order);
        }
      });
      
      setOrders(Array.from(uniqueOrders.values()));
      console.log(`Received ${data.length} orders, displaying ${uniqueOrders.size} unique orders`);
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Error fetching orders');
      toast.error('Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch favorites function
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

  // Updated useEffect to fetch favorites too
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserOrders();
      fetchAddresses();
      fetchFavorites();
    }
  }, [isLoggedIn]);

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      await addAddress(newAddress);
      setNewAddress({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        pincode: ''
      });
      setIsAddressDialogOpen(false);
      toast.success('Address added successfully');
    } catch (error) {
      toast.error('Failed to add address');
      console.error('Add address error:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(editFormData);
      setIsEditDialogOpen(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    }
  };

  const handleRemovePaymentMethod = (type, id) => {
    removePaymentMethod(type, id);
    toast.success('Payment method removed');
  };

  // Handle remove from favorites
  const handleRemoveFavorite = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please log in again.');
        return <Navigate to="/login" />;
      }

      await axios.delete(`${API_BASE_URL}/api/favorites/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setFavorites(favorites.filter(fav => 
        (fav.productId._id || fav.productId.id) !== productId
      ));

      toast.success('Removed from favorites');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        return <Navigate to="/login" />;
      }
      console.error('Failed to remove favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  // Define sidebar links
  const profileSections = [
    { id: 'orders', label: 'My Orders', icon: <Package className="h-5 w-5 mr-2" /> },
    { id: 'info', label: 'Profile Information', icon: <User className="h-5 w-5 mr-2" /> },
    { id: 'addresses', label: 'Manage Addresses', icon: <MapPin className="h-5 w-5 mr-2" /> },
    { id: 'wishlist', label: 'My Wishlist', icon: <Heart className="h-5 w-5 mr-2" /> }, // Added wishlist section
    { id: 'gift-cards', label: 'Gift Cards', icon: <Gift className="h-5 w-5 mr-2" /> },
    { id: 'reviews', label: 'My Reviews & Ratings', icon: <Star className="h-5 w-5 mr-2" /> },
    { id: 'coupons', label: 'My Coupons', icon: <Tag className="h-5 w-5 mr-2" /> }
  ];

  // Get user-specific reviews
  const userReviews = user && products ? products
    .filter(product => product.reviews && product.reviews.some(review => review.userId === user.id))
    .map(product => {
      const userReview = product.reviews.find(review => review.userId === user.id);
      return userReview ? { product, review: userReview } : null; // Ensure only valid reviews are included
    })
    .filter(Boolean) : []; // Remove null entries

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 mx-auto mb-3">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h3 className="font-semibold text-lg">{user?.name || 'User'}</h3>
              <p className="text-gray-500 text-sm">{user?.email || 'user@example.com'}</p>
            </div>
            
            <nav className="space-y-1">
              {profileSections.map((item) => (
                <Link
                  key={item.id}
                  to={`/profile${item.id === 'orders' ? '' : `/${item.id}`}`}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    selectedTab === item.id 
                      ? 'bg-srblue text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
              
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 w-full text-left"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card className="p-6">
            {selectedTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Orders</h2>

                {/* Add refresh button for orders */}
                <div className="mb-6 flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={fetchUserOrders} 
                    disabled={isLoading}
                  >
                    {isLoading ? "Refreshing..." : "Refresh Orders"}
                  </Button>
                </div>
                
                {/* Error message display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error}
                  </div>
                )}
                
                {isLoading ? (
                  <div className="text-center py-12">
                    <span className="text-gray-500">Loading orders...</span>
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order._id || order.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-4 flex justify-between items-center">
                          <div>
                            <div className="text-sm text-gray-500">Order #{order._id || order.id}</div>
                            <div className="text-sm text-gray-500">
                              Placed on {new Date(order.date || order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className={`
                            px-3 py-1 rounded-full text-sm font-medium
                            ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                            ${order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : ''}
                            ${order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${order.status === 'Pending' ? 'bg-gray-100 text-gray-800' : ''}
                            ${order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {order.status}
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="space-y-4">
                            {order.items.map((item) => (
                              <div key={item._id || item.id} className="flex items-center">
                                <div className="w-12 h-12 flex-shrink-0 mr-4 bg-gray-100 rounded">
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://placehold.co/100/e2e8f0/1e293b?text=SR';
                                    }}
                                  />
                                </div>
                                <div className="flex-1">
                                  <Link to={`/products/${item.productId}`} className="text-sm font-medium hover:text-srblue transition-colors">
                                    {item.name}
                                  </Link>
                                  <div className="text-sm text-gray-500">
                                    Quantity: {item.quantity}
                                  </div>
                                </div>
                                <div className="text-sm font-medium">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <div className="text-xl font-bold">
                              Total: ₹{order.total.toFixed(2)}
                            </div>
                            <Link to={`/order/${order._id || order.id}`}>
                              <Button variant="outline">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-6">
                      When you place orders, they will appear here.
                    </p>
                    <Link to="/products">
                      <Button className="bg-srblue hover:bg-blue-700">
                        Shop Now
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'info' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
                <div className="max-w-md mx-auto">
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-gray-500">Full Name</div>
                      <div className="col-span-2 font-medium">
                        {user?.name || 'Not provided'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-gray-500">Email</div>
                      <div className="col-span-2 font-medium">
                        {user?.email || 'Not provided'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-gray-500">Phone</div>
                      <div className="col-span-2 font-medium">
                        {user?.phone || 'Not provided'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-gray-500">Gender</div>
                      <div className="col-span-2 font-medium">
                        {user?.gender || 'Not specified'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-gray-500">Date of Birth</div>
                      <div className="col-span-2 font-medium">
                        {user?.dob ? new Date(user.dob).toLocaleDateString() : 'Not specified'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-gray-500">Joined Date</div>
                      <div className="col-span-2 font-medium">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setEditFormData({
                            name: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            gender: user?.gender || '',
                            dob: user?.dob || ''
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'addresses' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Manage Addresses</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Button className="w-full h-40 border-2 border-dashed flex flex-col items-center justify-center bg-white hover:bg-gray-50"
                      onClick={() => setIsAddressDialogOpen(true)}
                    >
                      <MapPin className="h-8 w-8 text-gray-400 mb-2" />
                      <span>Add New Address</span>
                    </Button>
                  </div>
                  
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4 relative">
                      <div className="font-semibold mb-1">{address.name}</div>
                      <div className="text-sm text-gray-600 mb-1">{address.phone}</div>
                      <div className="text-sm text-gray-600">
                        {address.street}, {address.city}, {address.state} - {address.pincode}
                      </div>
                      <div className="absolute top-2 right-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'gift-cards' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Gift Cards</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-white bg-opacity-10 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 -mb-8 -ml-8 bg-white bg-opacity-10 rounded-full"></div>
                    
                    <div className="relative z-10">
                      <h3 className="font-bold text-xl mb-2">Welcome Bonus</h3>
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-xs opacity-75">Valid till 31 Dec 2025</div>
                        <div className="text-2xl font-bold">₹500</div>
                      </div>
                      <div className="text-sm">Use code: <span className="font-mono font-bold">WELCOME500</span></div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-green-500 to-teal-500 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 -mt-8 -mr-8 bg-white bg-opacity-10 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 -mb-8 -ml-8 bg-white bg-opacity-10 rounded-full"></div>
                    
                    <div className="relative z-10">
                      <h3 className="font-bold text-xl mb-2">Birthday Special</h3>
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-xs opacity-75">Valid for 30 days</div>
                        <div className="text-2xl font-bold">₹200</div>
                      </div>
                      <div className="text-sm">Use code: <span className="font-mono font-bold">BDAY200</span></div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Redeem Gift Card</h3>
                  <div className="flex gap-2">
                    <Input placeholder="Enter gift card code" className="flex-1" />
                    <Button>Redeem</Button>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'reviews' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Reviews & Ratings</h2>
                
                {userReviews.length > 0 ? (
                  <div className="space-y-6">
                    {userReviews.map(({ product, review }) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 flex-shrink-0 mr-4 bg-gray-100 rounded">
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://placehold.co/100/e2e8f0/1e293b?text=SR';
                                }}
                              />
                            </div>
                            <div>
                              <Link to={`/products/${product.id}`} className="font-medium hover:text-srblue transition-colors">
                                {product.name}
                              </Link>
                              <div className="flex items-center mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`h-4 w-4 ${review.rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <p className="text-gray-700">{review.comment}</p>
                        
                        <div className="mt-4 flex justify-end">
                          <Link to={`/products/${product.id}`}>
                            <Button variant="outline" size="sm">
                              Edit Review
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Reviews Yet</h3>
                    <p className="text-gray-500 mb-6">
                      You haven't reviewed any products yet.
                    </p>
                    <Link to="/products">
                      <Button className="bg-srblue hover:bg-blue-700">
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'coupons' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Coupons</h2>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-lg">WELCOME10</div>
                      <div className="text-sm text-gray-500">10% off on your first order</div>
                      <div className="text-xs text-gray-400 mt-1">Valid till 31 Dec 2025</div>
                    </div>
                    <Button variant="outline" className="whitespace-nowrap">
                      Copy Code
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-lg">SUMMER25</div>
                      <div className="text-sm text-gray-500">25% off on summer collection</div>
                      <div className="text-xs text-gray-400 mt-1">Valid till 31 Aug 2025</div>
                    </div>
                    <Button variant="outline" className="whitespace-nowrap">
                      Copy Code
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'wishlist' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>
                {favorites && favorites.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {favorites.map((favorite) => {
                      const product = favorite.productId || favorite; // Handle both direct product objects and nested productId objects
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
                                  onClick={() => addToCart(product)}
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
                ) : (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">No items in your wishlist</h3>
                    <p className="text-gray-500 mb-6">
                      Products you add to your wishlist will appear here.
                    </p>
                    <Link to="/products">
                      <Button className="bg-srblue hover:bg-blue-700">
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              Enter the details for your new delivery address.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddressSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                  placeholder="123 Main Street, Apartment 4B"
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                    placeholder="Mumbai"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                    placeholder="Maharashtra"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                    placeholder="400001"
                    required
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddressDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-srblue hover:bg-blue-700">
                Save Address
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile Information</DialogTitle>
            <DialogDescription>
              Update your personal details below.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleProfileUpdate}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-gender">Gender</Label>
                  <select
                    id="edit-gender"
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="edit-dob">Date of Birth</Label>
                  <Input
                    id="edit-dob"
                    type="date"
                    value={editFormData.dob}
                    onChange={(e) => setEditFormData({...editFormData, dob: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-srblue hover:bg-blue-700">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;