import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useProduct } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import { Package, ArrowLeft, Check } from 'lucide-react';
import axios from 'axios';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, fetchOrders } = useProduct(); // Add fetchOrders
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
    
    // Show success message if navigated from checkout
    if (location.state?.newOrder) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [id, location.state]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8">Error: {error}</div>;
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Link to="/profile">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Orders
          </Button>
        </Link>
      </div>
    );
  }

  const handleBackToOrders = () => {
    fetchOrders(); // Fetch latest orders before navigating
    navigate('/profile');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-center">
          <Check className="text-green-500 h-5 w-5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-800">Order placed successfully!</h3>
            <p className="text-sm text-green-700">Thank you for your purchase. We will process your order shortly.</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Order Details</h1>
        <Button variant="outline" onClick={handleBackToOrders}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Orders
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                  <p className="text-gray-500">Placed on {new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div className={`
                  mt-4 md:mt-0 px-4 py-2 rounded-full text-sm font-medium inline-block
                  ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : ''}
                  ${order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : ''}
                  ${order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${order.status === 'Pending' ? 'bg-gray-100 text-gray-800' : ''}
                  ${order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                `}>
                  {order.status}
                </div>
              </div>
            </div>
            
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="p-6 flex flex-col sm:flex-row">
                  {/* Item Image */}
                  <div className="w-24 h-24 flex-shrink-0 mr-6 mb-4 sm:mb-0">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/200/e2e8f0/1e293b?text=SR+Electricals';
                      }}
                    />
                  </div>
                  
                  {/* Item Details */}
                  <div className="flex-grow">
                    <Link to={`/products/${item.id}`}>
                      <h3 className="text-lg font-medium mb-1 hover:text-srblue transition-colors">{item.name}</h3>
                    </Link>
                    <p className="text-gray-500 text-sm mb-2 capitalize">{item.category}</p>
                    <div className="flex flex-wrap justify-between items-center">
                      <div>
                        <span className="text-gray-500">Quantity: {item.quantity}</span>
                      </div>
                      <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₹{order.total.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">
                  {order.total >= 1000 ? 'Free' : '₹100.00'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">
                  ₹{(order.total + (order.total >= 1000 ? 0 : 100)).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-3">Shipping Information</h3>
              
              {order.address ? (
                <div className="text-sm space-y-2">
                  <p className="font-medium">{order.address.name}</p>
                  <p className="text-gray-600">
                    {order.address.street}, {order.address.city}, {order.address.state} - {order.address.pincode}
                  </p>
                  <p className="text-gray-600">Phone: {order.address.phone}</p>
                </div>
              ) : (
                <p className="text-gray-500">No shipping information available</p>
              )}
              
              <h3 className="font-semibold mt-6 mb-3">Payment Information</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className="font-medium">
                    {order.paymentMethod === 'cod' ? 'Pending' : 'Paid'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Link to="/products">
                <Button className="w-full bg-srblue hover:bg-blue-700">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;