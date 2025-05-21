const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/electricals', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// General API test route
app.get('/api/system-check', (req, res) => {
  console.log('System check endpoint called');
  res.json({
    status: 'ok',
    message: 'API is responding correctly',
    time: new Date().toISOString()
  });
});

// Debug endpoint for order status
app.get('/api/debug/order-status/:id', (req, res) => {
  console.log(`Debug order status endpoint called for ID: ${req.params.id}`);
  res.json({
    message: 'Order status debug endpoint working',
    id: req.params.id
  });
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  gender: { type: String },
  dob: { type: Date },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Address Schema
const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    image: { type: String }
  }],
  total: { type: Number, required: true },
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: true
  },
  paymentMethod: { type: String, required: true },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String }
  },
  status: { 
    type: String, 
    required: true, 
    default: 'Pending',
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] 
  },
  date: { type: Date, default: Date.now }
});

// Payment Method Schema
const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: { 
    type: String, 
    required: true,
    enum: ['upi', 'card'] 
  },
  details: {
    // For UPI
    upiId: { type: String },
    
    // For Card
    cardNumber: { type: String },
    cardName: { type: String },
    expiry: { type: String },
    // We don't store CVV for security reasons
  },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Product Schema (for reference)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  countInStock: { type: Number, required: true, default: 0 },
  reviews: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: { type: String, required: true },
      rating: { type: Number, required: true },
      comment: { type: String, required: true },
      date: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

// Favorites Schema - make sure this is still at the top with other schemas
const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

// Cart Schema
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    price: {
      type: Number,
      required: true
    },
    name: String,
    image: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create models
const User = mongoose.model('User', userSchema, 'users');
const Address = mongoose.model('Address', addressSchema, 'addresses');
const Order = mongoose.model('Order', orderSchema, 'orders');
const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema, 'paymentMethods');
const Product = mongoose.model('Product', productSchema, 'products');
const Favorite = mongoose.model('Favorite', favoriteSchema, 'favorites');
const Cart = mongoose.model('Cart', cartSchema, 'carts');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to generate token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('Auth error: Token expired', error);
      return res.status(401).json({ 
        message: 'Session expired. Please log in again.', 
        expiredAt: error.expiredAt 
      });
    }
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes

// Register Route
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin: email === 'admin@srelectricals.com' // Auto-set admin if this email
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get user profile
app.get('/api/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
app.put('/api/me', auth, async (req, res) => {
  try {
    const { name, email, phone, gender, dob } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;
    if (dob) user.dob = dob;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Address routes

// Get all addresses for a user
app.get('/api/addresses', auth, async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id });
    res.json(addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new address
app.post('/api/addresses', auth, async (req, res) => {
  try {
    const { name, phone, street, city, state, pincode, isDefault } = req.body;

    // Validation
    if (!name || !phone || !street || !city || !state || !pincode) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // If this is set as default, unset any existing default
    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.id, isDefault: true },
        { isDefault: false }
      );
    }

    // Create address
    const newAddress = new Address({
      userId: req.user.id,
      name,
      phone,
      street,
      city,
      state,
      pincode,
      isDefault: isDefault || false
    });

    await newAddress.save();

    res.status(201).json({
      message: 'Address added successfully',
      address: newAddress
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update address
app.put('/api/addresses/:id', auth, async (req, res) => {
  try {
    const addressId = req.params.id;
    const { name, phone, street, city, state, pincode, isDefault } = req.body;

    // Find address
    const address = await Address.findOne({ 
      _id: addressId,
      userId: req.user.id
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If setting as default, unset any existing default
    if (isDefault && !address.isDefault) {
      await Address.updateMany(
        { userId: req.user.id, isDefault: true },
        { isDefault: false }
      );
    }

    // Update fields
    if (name) address.name = name;
    if (phone) address.phone = phone;
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await address.save();

    res.json({
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete address
app.delete('/api/addresses/:id', auth, async (req, res) => {
  try {
    const addressId = req.params.id;

    // Find and delete address
    const address = await Address.findOneAndDelete({ 
      _id: addressId,
      userId: req.user.id
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.json({
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Order routes

// Get all orders for a user
app.get('/api/orders', auth, async (req, res) => {
  try {
    // For admin users, return all orders
    // For regular users, only return their own orders
    const query = req.user.isAdmin ? {} : { userId: req.user.id };
    console.log('Orders query:', query, 'User is admin:', req.user.isAdmin);

    const orders = await Order.find(query)
      .populate({
        path: 'shippingAddress',
        select: '-__v'
      })
      .populate({
        path: 'items.productId',
        select: 'name image price'
      })
      .sort({ date: -1 });

    console.log(`Total orders fetched: ${orders.length}`); // Debugging log

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get orders for the currently logged in user
app.get('/api/orders/user', auth, async (req, res) => {
  try {
    console.log('Fetching orders for authenticated user:', req.user.id);
    
    // Get distinct orders by _id to prevent duplicates
    const orders = await Order.find({ userId: req.user.id })
      .populate({
        path: 'shippingAddress',
        select: '-__v'
      })
      .populate({
        path: 'items.productId',
        select: 'name image price'
      })
      .sort({ date: -1 });
    
    // Check for and remove duplicates based on _id
    const uniqueOrderMap = new Map();
    orders.forEach(order => {
      const orderId = order._id.toString();
      if (!uniqueOrderMap.has(orderId)) {
        uniqueOrderMap.set(orderId, order);
      } else {
        console.log(`Found duplicate order with ID: ${orderId}`);
      }
    });
    
    const uniqueOrders = Array.from(uniqueOrderMap.values());
    console.log(`Found ${orders.length} orders, reduced to ${uniqueOrders.length} unique orders`);
    
    res.json(uniqueOrders);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order
app.get('/api/orders/:id', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // For admin users or the order owner
    const query = req.user.isAdmin 
      ? { _id: orderId } 
      : { _id: orderId, userId: req.user.id };
    
    const order = await Order.findOne(query)
      .populate('shippingAddress')
      .populate('items.productId');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new order
app.post('/api/orders', auth, async (req, res) => {
  try {
    const { items, total, shippingAddress, paymentMethod } = req.body;

    // Validation
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order items are required' });
    }
    if (!total || total <= 0) {
      return res.status(400).json({ message: 'Total amount must be greater than zero' });
    }
    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    // Ensure all items have required fields
    const validatedItems = items.map(item => {
      if (!item.productId || !item.name || !item.price || !item.quantity) {
        throw new Error('Each item must have productId, name, price, and quantity');
      }
      return {
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || ''
      };
    });

    // Create and save the order
    const newOrder = new Order({
      userId: req.user.id,
      items: validatedItems,
      total,
      shippingAddress,
      paymentMethod,
      status: 'Pending'
    });

    await newOrder.save();

    console.log('Order saved successfully:', newOrder); // Debugging log

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error while creating order', error: error.message });
  }
});

// Cancel order 
app.put('/api/orders/:id/cancel', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.id
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only allow cancellation if order is Pending or Processing
    if (!['Pending', 'Processing'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel order. Order has already been shipped or delivered.' 
      });
    }
    
    order.status = 'Cancelled';
    await order.save();
    
    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new order
app.post('/api/place-order', auth, async (req, res) => {
  try {
    const { items, total, shippingAddress, paymentMethod, paymentResult, notes } = req.body;

    // Create new order
    const newOrder = new Order({
      userId: req.user.id,
      items: items.map(item => ({
        productId: item.id || item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      total,
      shippingAddress,
      paymentMethod,
      paymentResult: paymentResult || {},
      notes,
      status: 'Pending',
      date: new Date()
    });

    const savedOrder = await newOrder.save();

    // Populate order details for response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('shippingAddress')
      .populate('items.productId');

    res.status(201).json({
      message: 'Order placed successfully',
      orderId: savedOrder._id,
      order: populatedOrder
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ 
      message: 'Server error while placing order',
      error: error.message
    });
  }
});

// Update order status (admin only)
app.put('/api/orders/:id/status', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    console.log('Processing order status update request:', { 
      orderId, 
      status, 
      user: req.user ? `${req.user.id} (admin: ${req.user.isAdmin})` : 'unknown'
    });
    
    // Validate input
    if (!status || !['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      console.log('Invalid status value:', status);
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Only admin should update order status (except for cancellation by user)
    if (!req.user.isAdmin && status !== 'Cancelled') {
      console.log('Permission denied - non-admin attempting to update status to:', status);
      return res.status(403).json({ message: 'Not authorized to update order status' });
    }
    
    // Check if MongoDB ObjectId is valid
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.log('Invalid ObjectId format:', orderId);
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('Order not found with ID:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // If regular user, verify they own the order
    if (!req.user.isAdmin && order.userId.toString() !== req.user.id) {
      console.log('Permission denied - non-admin user does not own this order');
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }
    
    // Update status
    order.status = status;
    await order.save();
    
    console.log('Order status updated successfully to:', status);
    
    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error during status update', error: error.message });
  }
});

// Special debug endpoint - add this before other order routes
app.get('/api/debug/orders/:id', (req, res) => {
  console.log(`Debug endpoint hit with ID: ${req.params.id}`);
  res.json({ 
    message: 'Debug endpoint working',
    id: req.params.id
  });
});

// Get monthly sales data
app.get('/api/sales/monthly', auth, async (req, res) => {
  try {
    // Ensure only admins can access this route
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const salesData = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$date" },
          totalSales: { $sum: "$total" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const formattedData = salesData.map((item) => ({
      month: item._id,
      sales: item.totalSales,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching monthly sales data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Payment method routes

// Get all payment methods for a user
app.get('/api/payment-methods', auth, async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ userId: req.user.id });
    
    // Mask sensitive data
    const maskedPaymentMethods = paymentMethods.map(method => {
      const result = method.toObject();
      
      // Mask card number if present
      if (result.type === 'card' && result.details.cardNumber) {
        result.details.cardNumber = 'xxxx-xxxx-xxxx-' + 
          result.details.cardNumber.slice(-4);
      }
      
      return result;
    });
    
    res.json(maskedPaymentMethods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new payment method
app.post('/api/payment-methods', auth, async (req, res) => {
  try {
    const { type, details, isDefault } = req.body;

    // Validation
    if (!type || !details) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Type-specific validation
    if (type === 'upi' && !details.upiId) {
      return res.status(400).json({ message: 'UPI ID is required' });
    }

    if (type === 'card' && (!details.cardNumber || !details.cardName || !details.expiry)) {
      return res.status(400).json({ message: 'Card details are incomplete' });
    }

    // If this is set as default, unset any existing default of the same type
    if (isDefault) {
      await PaymentMethod.updateMany(
        { userId: req.user.id, type, isDefault: true },
        { isDefault: false }
      );
    }

    // Create payment method
    const newPaymentMethod = new PaymentMethod({
      userId: req.user.id,
      type,
      details,
      isDefault: isDefault || false
    });

    await newPaymentMethod.save();

    // Mask card number in response
    const response = newPaymentMethod.toObject();
    if (response.type === 'card' && response.details.cardNumber) {
      response.details.cardNumber = 'xxxx-xxxx-xxxx-' + 
        response.details.cardNumber.slice(-4);
    }

    res.status(201).json({
      message: 'Payment method added successfully',
      paymentMethod: response
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete payment method
app.delete('/api/payment-methods/:id', auth, async (req, res) => {
  try {
    const paymentId = req.params.id;
    
    const paymentMethod = await PaymentMethod.findOneAndDelete({
      _id: paymentId,
      userId: req.user.id
    });
    
    if (!paymentMethod) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    
    res.json({
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Product routes
app.get('/api/products', async (req, res) => {
  try {
    let products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Check if productId is undefined or the string "undefined"
    if (!productId || productId === "undefined" || productId === "null") {
      return res.status(400).json({ 
        message: 'Invalid product ID provided',
        details: 'Product ID cannot be undefined or null'
      });
    }
    
    let product = null;
    
    // Check if ID is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(productId)) {
      console.log(`Looking up product by ObjectId: ${productId}`);
      product = await Product.findById(productId);
    } else {
      // If not a valid ObjectId, try to find by numeric ID field
      const numericId = parseInt(productId);
      console.log(`Looking up product by numeric ID: ${numericId}`);
      
      if (!isNaN(numericId)) {
        product = await Product.findOne({ id: numericId });
      } else {
        // Try string match on name as fallback (useful for testing)
        console.log(`Looking up product by name containing: ${productId}`);
        product = await Product.findOne({ 
          name: { $regex: productId, $options: 'i' }
        });
      }
    }
    
    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found',
        details: `No product found with ID: ${productId}`
      });
    }
    
    console.log(`Successfully found product: ${product.name}`);
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      message: 'Server error while retrieving product',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Admin routes for product management (no auth for simplicity)
app.post('/api/admin/products', async (req, res) => {
  try {
    const { name, description, price, image, category, brand, countInStock } = req.body;
    
    // Validation
    if (!name || !description || !price || !category || !brand) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const newProduct = new Product({
      name,
      description,
      price,
      image: image || 'https://placehold.co/400x300/e2e8f0/1e293b?text=No+Image',
      category,
      brand,
      countInStock: countInStock || 0,
      reviews: []
    });
    
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a product
app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const { name, description, price, image, category, brand, countInStock } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (image) product.image = image;
    if (category) product.category = category;
    if (brand) product.brand = brand;
    if (countInStock !== undefined) product.countInStock = countInStock;
    
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a product
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// FAVORITES ROUTES - Completely restructured and placed BEFORE other conflicting routes
console.log('Setting up favorites routes...');

// Check if a product is in favorites - SPECIFICITY MATTERS: put this BEFORE the /:productId route
app.get('/api/favorites/check/:productId', auth, async (req, res) => {
  try {
    console.log(`Checking if product ${req.params.productId} is in favorites for user ${req.user.id}`);
    const favorite = await Favorite.findOne({
      userId: req.user.id,
      productId: req.params.productId
    });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all favorites for current user
app.get('/api/favorites', auth, async (req, res) => {
  try {
    console.log(`Getting favorites for user ${req.user.id}`);
    const favorites = await Favorite.find({ userId: req.user.id })
      .populate('productId');
    
    console.log(`Found ${favorites.length} favorites`);
    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add to favorites
app.post('/api/favorites', auth, async (req, res) => {
  try {
    console.log(`Adding product ${req.body.productId} to favorites for user ${req.user.id}`);
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
      userId: req.user.id,
      productId
    });
    
    if (existingFavorite) {
      return res.status(400).json({ message: 'Product is already in favorites' });
    }
    
    // Create new favorite
    const newFavorite = new Favorite({
      userId: req.user.id,
      productId
    });
    
    await newFavorite.save();
    
    // Return populated favorite
    const favorite = await Favorite.findById(newFavorite._id)
      .populate('productId');
    
    res.status(201).json({
      message: 'Product added to favorites',
      favorite
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove from favorites
app.delete('/api/favorites/:productId', auth, async (req, res) => {
  try {
    console.log(`Removing product ${req.params.productId} from favorites for user ${req.user.id}`);
    const favorite = await Favorite.findOneAndDelete({
      userId: req.user.id,
      productId: req.params.productId
    });
    
    if (!favorite) {
      return res.status(404).json({ message: 'Product not found in favorites' });
    }
    
    res.json({
      message: 'Product removed from favorites',
      productId: req.params.productId
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Alias /favorites to /api/favorites for simplified access
app.get('/favorites', auth, async (req, res) => {
  console.log(`Favorites shortcut route for user ${req.user.id}`);
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .populate('productId');
    
    console.log(`Found ${favorites.length} favorites via shortcut route`);
    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error (shortcut route):', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add similar shortcuts for other favorite operations
app.post('/favorites', auth, (req, res) => {
  // Forward the request to the main API route handler
  app.handle(req, res, req.url.replace('/favorites', '/api/favorites'));
});

app.delete('/favorites/:productId', auth, (req, res) => {
  // Forward the request to the main API route handler
  app.handle(req, res, req.url.replace('/favorites', '/api/favorites'));
});

// CART API ROUTES
console.log('Setting up cart routes...');

// Debug endpoint to check if cart routes are accessible
app.get('/api/ping/cart', (req, res) => {
  console.log('Cart ping received');
  res.json({ message: 'Cart API is reachable' });
});

// Get user's cart
app.get('/api/cart', auth, async (req, res) => {
  try {
    console.log(`Getting cart for user ${req.user.id}`);
    
    let cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.productId');
    
    if (!cart) {
      // If no cart exists, create an empty one
      console.log(`No cart found for user ${req.user.id}, creating new cart`);
      cart = new Cart({
        userId: req.user.id,
        items: []
      });
      await cart.save();
    }
    
    console.log(`Returning cart with ${cart.items.length} items`);
    res.json(cart);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add item to cart
app.post('/api/cart', auth, async (req, res) => {
  try {
    const { productId, quantity, price, name, image } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    // Find user's cart or create a new one
    let cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart) {
      cart = new Cart({
        userId: req.user.id,
        items: []
      });
    }
    
    // Check if product already exists in cart
    const itemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId.toString()
    );
    
    if (itemIndex > -1) {
      // Product exists in cart, update the quantity
      cart.items[itemIndex].quantity += quantity || 1;
    } else {
      // Product does not exist in cart, add it
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      cart.items.push({
        productId,
        quantity: quantity || 1,
        price: price || product.price,
        name: name || product.name,
        image: image || product.image
      });
    }
    
    cart.updatedAt = Date.now();
    await cart.save();
    
    // Populate product info before returning
    const populatedCart = await Cart.findById(cart._id)
      .populate('items.productId');
      
    res.status(200).json({
      message: 'Item added to cart',
      cart: populatedCart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update cart item quantity
app.put('/api/cart/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }
    
    let cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId.toString()
    );
    
    if (itemIndex > -1) {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
      cart.updatedAt = Date.now();
      await cart.save();
      
      // Return updated cart
      const updatedCart = await Cart.findById(cart._id)
        .populate('items.productId');
      
      return res.status(200).json({
        message: 'Cart updated',
        cart: updatedCart
      });
    } else {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove item from cart
app.delete('/api/cart/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    let cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Filter out the item to be removed
    cart.items = cart.items.filter(item => 
      item.productId.toString() !== productId.toString()
    );
    
    cart.updatedAt = Date.now();
    await cart.save();
    
    res.status(200).json({
      message: 'Item removed from cart',
      productId
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear entire cart
app.delete('/api/cart', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();
    
    res.status(200).json({
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route to fetch recent activities
app.get('/api/activities', auth, async (req, res) => {
  try {
    const recentOrders = await Order.find()
      .sort({ date: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .select('userId status total date');

    const activities = recentOrders.map(order => ({
      type: 'Order',
      user: order.userId?.name || 'Unknown User',
      email: order.userId?.email || 'Unknown Email',
      status: order.status,
      total: order.total,
      date: order.date
    }));

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to fetch top customers
app.get('/api/customers/top', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const topCustomers = await Order.aggregate([
      {
        $group: {
          _id: "$userId",
          totalSpent: { $sum: "$total" },
          totalOrders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          name: "$user.name",
          email: "$user.email",
          totalSpent: 1,
          totalOrders: 1
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json(topCustomers);
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Diagnostic route to help debugging
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'API is working!' });
});

// Diagnostic route to check if API is responding
app.get('/api/ping', (req, res) => {
  console.log('Ping received');
  res.json({ message: 'Server is up and running!' });
});

// Diagnostic route to check for missing or invalid orders
app.get('/api/debug/orders', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allOrders = await Order.find();
    const invalidOrders = allOrders.filter(order => !order.items || order.items.length === 0 || !order.total);

    console.log(`Total orders in database: ${allOrders.length}`);
    console.log(`Invalid orders found: ${invalidOrders.length}`);

    res.json({
      totalOrders: allOrders.length,
      invalidOrders: invalidOrders.length,
      invalidOrderDetails: invalidOrders
    });
  } catch (error) {
    console.error('Debug orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Make sure there is no duplicate route registration below
console.log('All routes registered successfully');

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Safer way to print routes - just list the main endpoints
  console.log('\nActive API Routes:');
  console.log('- Authentication: /api/login, /api/register');
  console.log('- User: /api/me');
  console.log('- Addresses: /api/addresses');
  console.log('- Orders: /api/orders, /api/orders/:id/status');
  console.log('- Products: /api/products');
  console.log('- Favorites: /api/favorites');
  console.log('- Cart: /api/cart');
  console.log('- Payment Methods: /api/payment-methods');
  console.log('- Debug: /api/system-check, /api/debug/order-status/:id');
});