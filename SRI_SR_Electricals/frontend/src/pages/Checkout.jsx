import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProduct } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Check, CreditCard, AlertCircle, ArrowLeft, Wallet } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '@/config/api';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    cart, 
    getCartTotal, 
    user, 
    isLoggedIn, 
    addresses, 
    addAddress, 
    placeOrder,
    savedPaymentMethods,
    savePaymentMethod,
    clearCart  // Add this
  } = useProduct();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [newAddress, setNewAddress] = useState({
    name: user?.name || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
 
  const [upiError, setUpiError] = useState('');
  
  // Add state for order summary from cart
  const [orderSummary, setOrderSummary] = useState(null);
  const [cartItemsFromNav, setCartItemsFromNav] = useState([]);
  
  // Check if we're using Buy Now
  const isBuyNow = location.state?.buyNow || false;
  const buyNowProduct = location.state?.product || null;

  // Filter saved UPI IDs to only show current user's
 
  
  // Effect to select the first address by default if available
  useEffect(() => {
    if (addresses?.length > 0 && !selectedAddress) {
      // Safely access id and convert to string
      const firstAddressId = addresses[0]?.id;
      if (firstAddressId !== undefined) {
        setSelectedAddress(String(firstAddressId));
      }
    }
  }, [addresses, selectedAddress]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [isLoggedIn, navigate]);
  
  // Check if we're using Buy Now and log the data for debugging
  useEffect(() => {
    if (location.state?.buyNow) {
      console.log("Checkout received buy-now product:", location.state.product);
      
      if (!location.state.product) {
        toast({
          title: "Error",
          description: "No product data received for checkout",
          variant: "destructive",
        });
        navigate('/products');
      }
    } else if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your shopping cart is empty",
        variant: "default",
      });
      navigate('/products');
    }
  }, [location.state, cart, navigate, toast]);

  // Redirect if cart is empty and not using Buy Now
  useEffect(() => {
    if (cart.length === 0 && !isBuyNow) {
      navigate('/products');
    }
  }, [cart, isBuyNow, navigate]);

  // Check if we're using data passed from cart page
  useEffect(() => {
    console.log("Location state received:", location.state);
    if (location.state?.fromCart) {
      console.log("Order summary from cart:", location.state.summary);
      console.log("Cart items from cart:", location.state.cartItems);
      
      // Store the cart summary data in state
      setOrderSummary(location.state.summary);
      setCartItemsFromNav(location.state.cartItems || []);
    }
  }, [location.state]);

  const steps = [
    { title: 'Login', completed: isLoggedIn },
    { title: 'Address', completed: selectedAddress !== '' },
    { title: 'Review', completed: false },
    { title: 'Payment', completed: false }
  ];

  const handleNextStep = () => {
    if (currentStep === 1 && !isLoggedIn) {
      return;
    }
    
    if (currentStep === 2 && !selectedAddress) {
      toast({
        title: "Please select an address",
        description: "You need to select a delivery address to proceed.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      // Use await since addAddress is an async function
      const response = await addAddress(newAddress);
      console.log("Address API response:", response); // Debug log
      
      // Extract the actual address from the response
      const addressObject = response.address || response;
      console.log("Extracted address object:", addressObject); // Debug log
      
      // Add null checks before accessing id property (check both id and _id)
      if (addressObject) {
        // MongoDB uses _id, our local state might use id - handle both
        const addressId = addressObject._id || addressObject.id;
        
        if (addressId) {
          // Safely convert to string
          const addressIdString = String(addressId);
          console.log("Setting selected address to:", addressIdString); // Debug log
          setSelectedAddress(addressIdString);
          
          // Reset the form fields
          setNewAddress({
            name: user?.name || '',
            phone: '',
            street: '',
            city: '',
            state: '',
            pincode: ''
          });
          
          toast({
            title: "Address added",
            description: "Your new address has been added successfully.",
          });
          
          // Force refresh addresses list to ensure it's up to date
          await fetchAddresses();
        } else {
          console.error("Address added but ID is missing:", addressObject);
          toast({
            title: "Error adding address",
            description: "Address was added but ID is missing",
            variant: "destructive",
          });
        }
      } else {
        console.error("Failed to add address - no address object returned");
        toast({
          title: "Error adding address",
          description: "Something went wrong while adding your address",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in handleAddAddress:", error);
      toast({
        title: "Error adding address",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  

  

  
  
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleConfirmOrder = async () => {
    console.log("Selected Address ID:", selectedAddress);
    console.log("Available addresses:", addresses);
    
    // More robust address finding logic that handles both _id and id
    const address = addresses?.find(addr => {
      if (!addr) return false;
      
      // Get the selected address ID and both possible ID fields from the address
      const selectedId = String(selectedAddress || '');
      const addrId = addr.id ? String(addr.id) : '';
      const addrMongoId = addr._id ? String(addr._id) : '';
      
      console.log(`Comparing address - Selected: ${selectedId}, ID: ${addrId}, _ID: ${addrMongoId}`);
      
      // Match on either ID field
      return selectedId === addrId || selectedId === addrMongoId;
    });
    
    console.log("Found address for order:", address);
  
    if (!address) {
      toast({
        title: "Address not found",
        description: "Please select a valid delivery address or add a new one",
        variant: "destructive",
      });
      return;
    }
  
    const orderItems = isBuyNow 
      ? [{ 
          // Add null checks for product IDs
          productId: buyNowProduct && (buyNowProduct._id || buyNowProduct.id),
          name: buyNowProduct?.name || "Unknown Product",
          price: buyNowProduct?.price || 0,
          quantity: buyNowProduct?.quantity || 1,
          image: buyNowProduct?.image || ""
        }]
      : cartItemsFromNav.length > 0 
        ? cartItemsFromNav  // Use items passed from cart page if available
        : cart.map(item => ({
            // Add null checks for item IDs
            productId: item && (item._id || item.id),
            name: item?.name || "Unknown Item",
            price: item?.price || 0,
            quantity: item?.quantity || 1,
            image: item?.image || ""
          }));
  
    const orderData = {
      items: orderItems,
      total: total,
      // Use _id if available, otherwise use id, with null check
      shippingAddress: address?._id || address?.id,
      paymentMethod,
      notes,
    };
  
    try {
      if (paymentMethod === 'razorpay') {
        const res = await loadRazorpay();
        if (!res) {
          toast({
            title: "Failed to load Razorpay",
            description: "Please check your internet connection.",
            variant: "destructive",
          });
          return;
        }
  
        const options = {
          key: "rzp_test_pYO1RxhwzDCppY",
          amount: Math.round(total * 100),
          currency: "INR",
          name: "SR Electricals",
          description: "Order Payment",
          handler: async function (response) {
            // Add payment result to order data
            orderData.paymentResult = {
              id: response.razorpay_payment_id,
              status: 'completed',
              update_time: new Date().toISOString(),
            };
  
            // Place order with payment details
            await placeOrderInDb(orderData);
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: address?.phone || ""
          },
          theme: { color: "#3399cc" }
        };
  
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
      } else {
        // For COD, directly place the order
        await placeOrderInDb(orderData);
      }
    } catch (error) {
      toast({
        title: "Error placing order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add new helper function to place order
  const placeOrderInDb = async (orderData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/place-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }

      const data = await response.json();

      // Clear cart if not using buy now and clearCart is available
      if (!isBuyNow && typeof clearCart === 'function') {
        clearCart();
      }

      // Show success message
      toast({
        title: "Order placed successfully!",
        description: `Order ID: ${data.orderId}`,
      });

      // Navigate to order success page
      navigate(`/order/${data.orderId}`, { 
        state: { 
          newOrder: true,
          orderId: data.orderId 
        } 
      });
    } catch (error) {
      toast({
        title: "Error placing order",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);
  };

  // Calculate shipping and total
  const subtotal = useMemo(() => {
    // First priority: Use data passed from cart page if available
    if (orderSummary) {
      return orderSummary.subtotal;
    }
    // Second priority: Use buy now product if in buy now mode
    if (isBuyNow && buyNowProduct) {
      return buyNowProduct.price * (buyNowProduct.quantity || 1);
    }
    // Third priority: Calculate from cart context
    return getCartTotal();
  }, [orderSummary, isBuyNow, buyNowProduct, getCartTotal]);

  // Use passed shipping cost if available, otherwise calculate
  const shipping = useMemo(() => {
    if (orderSummary) {
      return orderSummary.shippingCost;
    }
    return subtotal >= 1000 ? 0 : 100;
  }, [orderSummary, subtotal]);

  // Use passed total if available, otherwise calculate
  const total = useMemo(() => {
    if (orderSummary) {
      return orderSummary.totalAmount;
    }
    return subtotal + shipping;
  }, [orderSummary, subtotal, shipping]);

  // For the order items display, prioritize items passed from cart
  const displayItems = useMemo(() => {
    if (cartItemsFromNav.length > 0) {
      return cartItemsFromNav;
    }
    if (isBuyNow) {
      return [buyNowProduct].filter(Boolean);
    }
    return cart;
  }, [cartItemsFromNav, isBuyNow, buyNowProduct, cart]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
      
      {/* Checkout Steps */}
      <div className="flex items-center justify-between mb-12">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`step-item ${currentStep === index + 1 ? 'active' : ''} ${step.completed ? 'complete' : ''}`}
          >
            <div className={`step ${currentStep === index + 1 ? 'active' : ''} ${step.completed ? 'complete' : ''}`}>
              {step.completed ? (
                <Check className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </div>
            <p className="text-sm mt-2">{step.title}</p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Step 1: Login Info */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Account Information</h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start">
                  <Check className="text-green-500 h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">You are logged in</p>
                    <p className="text-sm text-green-700 mt-1">
                      Logged in as {user?.name} ({user?.email})
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleNextStep}
                    className="bg-srblue hover:bg-blue-700"
                  >
                    Continue to Shipping
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Shipping Address</h2>
                
                {addresses?.length > 0 ? (
                  <div className="mb-6">
                    <Label className="mb-3 block">Select a delivery address</Label>
                    <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                      <div className="grid grid-cols-1 gap-4">
                        {addresses.map((address) => {
                          // Get the appropriate ID (either id or _id)
                          const addressId = address._id || address.id;
                          
                          // Skip addresses without any ID to prevent errors
                          if (!addressId) return null;
                          
                          // Convert to string safely
                          const addressIdString = String(addressId);
                          
                          return (
                            <div key={addressIdString} className="flex items-start space-x-3">
                              <RadioGroupItem 
                                id={`address-${addressIdString}`} 
                                value={addressIdString} 
                                className="mt-1"
                              />
                              <Label htmlFor={`address-${addressIdString}`} className="flex-1 cursor-pointer">
                                <div className={`border rounded-lg p-4 ${selectedAddress === addressIdString ? 'border-srblue bg-blue-50' : ''}`}>
                                  <div className="font-semibold">{address.name || 'No Name'}</div>
                                  <div className="text-sm text-gray-600 mt-1">{address.phone || 'No Phone'}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {address.street || 'No Street'}, {address.city || 'No City'}, {address.state || 'No State'} - {address.pincode || 'No Pincode'}
                                  </div>
                                </div>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  </div>
                ) : (
                  <div className="mb-6">
                    <p className="text-gray-500">No addresses found. Please add a new delivery address.</p>
                  </div>
                )}
                
                {addresses.length === 0 || (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-4">Add a new delivery address</h3>
                  </div>
                )}
                
                <form onSubmit={handleAddAddress} className="space-y-4 border-t pt-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      variant="outline"
                      className="mr-4"
                    >
                      Add Address
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handlePreviousStep}
                      variant="outline" 
                      className="mr-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleNextStep}
                      disabled={selectedAddress === ''}
                      className="bg-srblue hover:bg-blue-700"
                    >
                      Continue to Review
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Review Your Order</h2>
                
                <div className="space-y-6 mb-6">
                  {displayItems.map((item) => (
                    <div key={item.id || item._id || Math.random()} className="flex items-center border-b pb-4">
                      <div className="w-16 h-16 flex-shrink-0 mr-4">
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
                      
                      <div className="flex-grow">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-gray-500 text-sm">Quantity: {item.quantity || 1}</p>
                      </div>
                      
                      <div className="font-semibold">
                        ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mb-6">
                  <Label htmlFor="notes" className="mb-2 block">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special delivery instructions or notes"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handlePreviousStep}
                    variant="outline" 
                    className="mr-4"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleNextStep}
                    className="bg-srblue hover:bg-blue-700"
                  >
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
                
                <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange} className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem id="cod" value="cod" className="mt-1" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className={`border rounded-lg p-4 ${paymentMethod === 'cod' ? 'border-srblue bg-blue-50' : ''}`}>
                        <div className="font-semibold">Cash on Delivery</div>
                        <div className="text-sm text-gray-600 mt-1">Pay when your order is delivered</div>
                      </div>
                    </Label>
                  </div>
                  
                  
                       
                  
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem id="razorpay" value="razorpay" className="mt-1" />
                    <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                      <div className={`border rounded-lg p-4 ${paymentMethod === 'razorpay' ? 'border-srblue bg-blue-50' : ''}`}>
                        <div className="flex items-center">
                          <div className="font-semibold">Pay Online</div>
                          <div className="ml-3 flex space-x-2">
                            <CreditCard className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Credit/Debit Card, UPI, Net Banking</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                
                {paymentMethod === 'razorpay' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 flex items-start">
                    <AlertCircle className="text-blue-500 h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-700">
                      <p>You'll be redirected to Razorpay's secure payment page.</p>
                      <p className="mt-1">Your order will be processed once payment is complete.</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={handlePreviousStep}
                    variant="outline" 
                    className="mr-4"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleConfirmOrder}
                    className="bg-srblue hover:bg-blue-700"
                  >
                    Place Order
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-600">
                  Subtotal ({displayItems.reduce((acc, item) => acc + (item.quantity || 1), 0)} items)
                </span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">
                  {shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">Order Details</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span>{isBuyNow ? (buyNowProduct.quantity || 1) : cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </div>
                {currentStep >= 2 && selectedAddress && (
                  <div>
                    <h4 className="font-medium text-gray-700 mt-4 mb-1">Delivery Address</h4>
                    {(() => {
                      // Use safer finding logic with explicit string conversion
                      const selectedAddr = addresses?.find(addr => {
                        if (!addr || !addr.id || !selectedAddress) return false;
                        return String(addr.id) === String(selectedAddress);
                      });
                      
                      return selectedAddr ? (
                        <div className="text-gray-600 text-sm">
                          <p>{selectedAddr.name || 'No Name'}</p>
                          <p className="mt-1">
                            {selectedAddr.street || 'No Street'},
                            {selectedAddr.city || 'No City'},
                            {selectedAddr.state || 'No State'} - 
                            {selectedAddr.pincode || 'No Pincode'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-600">No address selected</p>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;