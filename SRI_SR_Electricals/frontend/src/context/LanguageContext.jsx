
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Language translations
const translations = {
  en: {
    // Navigation
    home: "Home",
    about: "About",
    products: "Products",
    cart: "Cart",
    favorites: "Favorites",
    login: "Login",
    profile: "Profile",
    logout: "Logout",
    admin: "Admin",
    
    // Product Details
    addToCart: "Add to Cart",
    buyNow: "Buy Now",
    addToWishlist: "Add to Wishlist",
    removeFromWishlist: "Remove from Wishlist",
    quantity: "Quantity",
    description: "Description",
    specifications: "Specifications",
    reviews: "Reviews",
    relatedProducts: "Related Products",
    writeReview: "Write a Review",
    editReview: "Edit Your Review",
    submitReview: "Submit Review",
    updateReview: "Update Review",
    
    // Common
    search: "Search",
    category: "Category",
    price: "Price",
    freeDelivery: "Free delivery for orders above ₹1000",
    warranty: "1 year warranty included",
    searchByVoice: "Search by voice",
    listening: "Listening...",
    
    // Specific to Product Details
    productDescription: "Product Description",
    technicalSpecifications: "Technical Specifications",
    productName: "Product Name",
    modelNumber: "Model Number",
    countryOfOrigin: "Country of Origin",
    returnPolicy: "Return Policy",
    customerReviews: "Customer Reviews",
    noReviews: "No reviews yet. Be the first to review this product!",
    loginToReview: "Login to Write a Review",
    shareThoughts: "Share your thoughts about this product with other customers.",
    rating: "Rating",
    yourReview: "Your Review",
    cancel: "Cancel",

    // Home Page
    featuredProducts: "Featured Products",
    newArrivals: "New Arrivals",
    bestSellers: "Best Sellers",
    shopNow: "Shop Now",
    viewMore: "View More",
    exploreCategories: "Explore Categories",
    specialOffers: "Special Offers",
    welcomeMessage: "Welcome to SR Electricals",
    heroSubtitle: "Your one-stop shop for quality electrical products",
    whyChooseSR: "Why Choose SR Electricals?",
    qualityProducts: "Quality Products",
    qualityDescription: "All our products meet rigorous quality standards and come with a guarantee.",
    fastDelivery: "Fast Delivery",
    deliveryDescription: "Get your orders delivered quickly to your doorstep within 1-3 business days.",
    safeReliable: "Safe & Reliable",
    safeDescription: "Our products are safety-certified and reliable for long-term use.",
    support: "24/7 Support",
    supportDescription: "Our customer service team is available round the clock to assist you.",
    readyToUpgrade: "Ready to Upgrade Your Electrical Systems?",
    browseCatalog: "Browse our extensive catalog of high-quality electrical products and find exactly what you need.",
    customerSay: "What Our Customers Say",
    shopByCategory: "Shop by Category",
    
    // About Page
    aboutTitle: "About Us",
    ourStory: "Our Story",
    mission: "Our Mission",
    vision: "Our Vision",
    storyContent: "SR Electricals was founded in 2005 with a simple goal - to provide high-quality electrical products at affordable prices. What started as a small shop has now grown into a trusted brand across the region.",
    missionContent: "To deliver reliable electrical solutions that meet the evolving needs of our customers while maintaining the highest standards of quality and service.",
    visionContent: "To be the most trusted name in the electrical industry, known for innovation, reliability, and customer satisfaction.",
    team: "Our Team",
    contactUs: "Contact Us",
    address: "Address",
    phone: "Phone",
    email: "Email",
    
    // Cart Page
    yourCart: "Your Cart",
    emptyCart: "Your cart is empty",
    startShopping: "Start Shopping",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total",
    checkout: "Checkout",
    continueShopping: "Continue Shopping",
    removeItem: "Remove Item",
    cartItems: "Cart Items",
    orderSummary: "Order Summary",
    proceedToCheckout: "Proceed to Checkout",
    availablePaymentMethods: "Available Payment Methods:",
    cashOnDelivery: "Cash on Delivery",
    cards: "Credit/Debit Cards",
    upiPayment: "UPI Payment",
    checkoutUnavailable: "Checkout is currently unavailable. Please contact the store administrator.",
    pleaseLoginFirst: "Please login first",
    needLoginForCart: "You need to login to view your cart.",
    browseProducts: "Browse Products",
    emptyCartMessage: "Looks like you haven't added any products to your cart yet.",
    
    // Product Categories
    lighting: "Lighting",
    wiring: "Wiring",
    switches: "Switches",
    safety: "Safety",
    solar: "Solar",
    tools: "Tools",
    
    // Admin Dashboard
    dashboard: "Dashboard",
    salesOverview: "Sales Overview",
    recentOrders: "Recent Orders",
    analytics: "Analytics",
    productManagement: "Products",
    orderManagement: "Orders",
    customerManagement: "Customers",
    storeSettings: "Settings",
    orderStatus: "Order Status",
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    totalSales: "Total Revenue",
    totalOrders: "Orders",
    totalProducts: "Products",
    totalCustomers: "Customers",
    salesOverTime: "Sales Over Time",
    salesByCategory: "Sales by Category",
    forSelectedPeriod: "For the selected period",
    totalProductsCatalog: "Total products in catalog",
    activeCustomers: "Active customers",
    dateRange: "Date Range",
    lastSevenDays: "Last 7 Days",
    lastThirtyDays: "Last 30 Days",
    lastTwelveMonths: "Last 12 Months",
    topSellingProducts: "Top Selling Products",
    customerGrowth: "Customer Growth",
    revenueByPaymentMethod: "Revenue by Payment Method",
    dailyVisitors: "Daily Visitors",
    stockLevels: "Stock Levels",
    outOfStock: "Out of Stock",
    lowStock: "Low Stock",
    inStock: "In Stock",
    weeklyTrends: "Weekly Trends",
    performanceMetrics: "Performance Metrics",
  },
  ta: {
    // Navigation
    home: "முகப்பு",
    about: "எங்களை பற்றி",
    products: "பொருட்கள்",
    cart: "வண்டி",
    favorites: "பிடித்தவை",
    login: "உள்நுழைய",
    profile: "சுயவிவரம்",
    logout: "வெளியேறு",
    admin: "நிர்வாகி",
    
    // Product Details
    addToCart: "வண்டியில் சேர்",
    buyNow: "இப்போது வாங்கு",
    addToWishlist: "விருப்பப்பட்டியலில் சேர்",
    removeFromWishlist: "விருப்பப்பட்டியலில் இருந்து நீக்கு",
    quantity: "அளவு",
    description: "விளக்கம்",
    specifications: "விவரக்குறிப்புகள்",
    reviews: "மதிப்புரைகள்",
    relatedProducts: "தொடர்புடைய பொருட்கள்",
    writeReview: "மதிப்புரை எழுது",
    editReview: "உங்கள் மதிப்புரையைத் திருத்து",
    submitReview: "மதிப்புரையை சமர்ப்பி",
    updateReview: "மதிப்புரையை புதுப்பி",
    
    // Common
    search: "தேடு",
    category: "வகை",
    price: "விலை",
    freeDelivery: "₹1000க்கு மேல் உள்ள ஆர்டர்களுக்கு இலவச டெலிவரி",
    warranty: "1 வருட உத்தரவாதம் சேர்க்கப்பட்டுள்ளது",
    searchByVoice: "குரல் மூலம் தேடுங்கள்",
    listening: "கேட்கிறது...",
    
    // Specific to Product Details
    productDescription: "பொருள் விளக்கம்",
    technicalSpecifications: "தொழில்நுட்ப விவரக்குறிப்புகள்",
    productName: "பொருளின் பெயர்",
    modelNumber: "மாடல் எண்",
    countryOfOrigin: "தயாரிப்பு நாடு",
    returnPolicy: "திருப்பி அனுப்பும் கொள்கை",
    customerReviews: "வாடிக்கையாளர் மதிப்புரைகள்",
    noReviews: "இதுவரை மதிப்புரைகள் இல்லை. இந்தப் பொருளை மதிப்பிட முதல் நபராக இருங்கள்!",
    loginToReview: "மதிப்புரை எழுத உள்நுழையவும்",
    shareThoughts: "இந்தப் பொருளைப் பற்றிய உங்கள் கருத்துகளை மற்ற வாடிக்கையாளர்களுடன் பகிரவும்.",
    rating: "மதிப்பீடு",
    yourReview: "உங்கள் மதிப்புரை",
    cancel: "ரத்து செய்",

    // Home Page
    featuredProducts: "சிறப்பு பொருட்கள்",
    newArrivals: "புதிய வரவுகள்",
    bestSellers: "அதிகம் விற்பனையாகும் பொருட்கள்",
    shopNow: "இப்போதே கடையில் வாங்குங்கள்",
    viewMore: "மேலும் காண்க",
    exploreCategories: "வகைகளை ஆராயுங்கள்",
    specialOffers: "சிறப்பு சலுகைகள்",
    welcomeMessage: "SR எலெக்ட்ரிக்கல்ஸுக்கு வரவேற்கிறோம்",
    heroSubtitle: "தரமான மின்சார பொருட்களுக்கான உங்கள் ஒரே இடம்",
    whyChooseSR: "ஏன் SR எலெக்ட்ரிக்கல்ஸை தேர்வு செய்ய வேண்டும்?",
    qualityProducts: "தரமான பொருட்கள்",
    qualityDescription: "எங்கள் அனைத்து பொருட்களும் கடுமையான தர நிலைகளை பூர்த்தி செய்கின்றன மற்றும் உத்தரவாதத்துடன் வருகின்றன.",
    fastDelivery: "விரைவான டெலிவரி",
    deliveryDescription: "1-3 வணிக நாட்களுக்குள் உங்கள் ஆர்டர்களை விரைவாக உங்கள் வீட்டுக்கே பெறுங்கள்.",
    safeReliable: "பாதுகாப்பான & நம்பகமான",
    safeDescription: "எங்கள் பொருட்கள் பாதுகாப்பு சான்றளிக்கப்பட்டவை மற்றும் நீண்ட கால பயன்பாட்டிற்கு நம்பகமானவை.",
    support: "24/7 ஆதரவு",
    supportDescription: "எங்கள் வாடிக்கையாளர் சேவை குழு உங்களுக்கு உதவ 24 மணி நேரமும் கிடைக்கிறது.",
    readyToUpgrade: "உங்கள் மின்சார அமைப்புகளை மேம்படுத்த தயாரா?",
    browseCatalog: "உயர்தர மின்சார பொருட்களின் எங்கள் விரிவான பட்டியலை உலாவி, உங்களுக்குத் தேவையான அனைத்தையும் கண்டறியுங்கள்.",
    customerSay: "எங்கள் வாடிக்கையாளர்கள் என்ன சொல்கிறார்கள்",
    shopByCategory: "வகையின்படி கடை",
    
    // About Page
    aboutTitle: "எங்களை பற்றி",
    ourStory: "எங்கள் கதை",
    mission: "எங்கள் நோக்கம்",
    vision: "எங்கள் தொலைநோக்கு",
    storyContent: "எஸ்ஆர் எலெக்ட்ரிக்கல்ஸ் 2005 ஆம் ஆண்டில் ஒரு எளிய இலக்குடன் நிறுவப்பட்டது - மலிவு விலையில் உயர்தர மின் பொருட்களை வழங்குவது. ஒரு சிறிய கடையாக தொடங்கியது இப்போது பிராந்தியம் முழுவதும் நம்பகமான பிராண்டாக வளர்ந்துள்ளது.",
    missionContent: "தரம் மற்றும் சேவையின் உயர்ந்த தரங்களை பராமரித்து வாடிக்கையாளர்களின் வளர்ந்து வரும் தேவைகளை பூர்த்தி செய்யும் நம்பகமான மின் தீர்வுகளை வழங்குவது.",
    visionContent: "புதுமை, நம்பகத்தன்மை மற்றும் வாடிக்கையாளர் திருப்தி ஆகியவற்றிற்காக அறியப்படும் மின் துறையில் மிகவும் நம்பகமான பெயராக இருப்பது.",
    team: "எங்கள் குழு",
    contactUs: "எங்களை தொடர்பு கொள்ள",
    address: "முகவரி",
    phone: "தொலைபேசி",
    email: "மின்னஞ்சல்",
    
    // Cart Page
    yourCart: "உங்கள் வண்டி",
    emptyCart: "உங்கள் வண்டி காலியாக உள்ளது",
    startShopping: "ஷாப்பிங் தொடங்கவும்",
    subtotal: "கூட்டுத்தொகை",
    shipping: "அனுப்புதல்",
    total: "மொத்தம்",
    checkout: "பணம் செலுத்து",
    continueShopping: "ஷாப்பிங் தொடரவும்",
    removeItem: "பொருளை அகற்று",
    cartItems: "வண்டி பொருட்கள்",
    orderSummary: "ஆர்டர் சுருக்கம்",
    proceedToCheckout: "பணம் செலுத்த தொடரவும்",
    availablePaymentMethods: "கிடைக்கும் பணம் செலுத்தும் முறைகள்:",
    cashOnDelivery: "டெலிவரியின் போது பணம் செலுத்துதல்",
    cards: "கிரெடிட்/டெபிட் கார்டுகள்",
    upiPayment: "யுபிஐ பேமெண்ட்",
    checkoutUnavailable: "செக்அவுட் தற்போது கிடைக்கவில்லை. தயவுசெய்து கடை நிர்வாகியைத் தொடர்பு கொள்ளவும்.",
    pleaseLoginFirst: "முதலில் உள்நுழையவும்",
    needLoginForCart: "உங்கள் வண்டியைப் பார்க்க நீங்கள் உள்நுழைய வேண்டும்.",
    browseProducts: "பொருட்களை உலாவுங்கள்",
    emptyCartMessage: "நீங்கள் இன்னும் உங்கள் வண்டியில் எந்தப் பொருட்களையும் சேர்க்கவில்லை போல் தெரிகிறது.",
    
    // Product Categories
    lighting: "லைட்டிங்",
    wiring: "வயரிங்",
    switches: "ஸ்விட்சஸ்",
    safety: "பாதுகாப்பு",
    solar: "சோலார்",
    tools: "கருவிகள்",
    
    // Admin Dashboard
    dashboard: "டாஷ்போர்டு",
    salesOverview: "விற்பனை மேலோட்டம்",
    recentOrders: "சமீபத்திய ஆர்டர்கள்",
    analytics: "பகுப்பாய்வுகள்",
    productManagement: "பொருட்கள்",
    orderManagement: "ஆர்டர்கள்",
    customerManagement: "வாடிக்கையாளர்கள்",
    storeSettings: "அமைப்புகள்",
    orderStatus: "ஆர்டர் நிலை",
    pending: "நிலுவையில் உள்ளது",
    processing: "செயல்படுத்துகிறது",
    shipped: "அனுப்பப்பட்டது",
    delivered: "வழங்கப்பட்டது",
    cancelled: "ரத்து செய்யப்பட்டது",
    totalSales: "மொத்த வருவாய்",
    totalOrders: "ஆர்டர்கள்",
    totalProducts: "பொருட்கள்",
    totalCustomers: "வாடிக்கையாளர்கள்",
    salesOverTime: "காலப்போக்கில் விற்பனை",
    salesByCategory: "வகை வாரியான விற்பனை",
    forSelectedPeriod: "தேர்ந்தெடுக்கப்பட்ட காலத்திற்கு",
    totalProductsCatalog: "கேடலாக்கில் உள்ள மொத்த பொருட்கள்",
    activeCustomers: "செயலில் உள்ள வாடிக்கையாளர்கள்",
    dateRange: "தேதி வரம்பு",
    lastSevenDays: "கடந்த 7 நாட்கள்",
    lastThirtyDays: "கடந்த 30 நாட்கள்",
    lastTwelveMonths: "கடந்த 12 மாதங்கள்",
    topSellingProducts: "அதிகம் விற்பனையாகும் பொருட்கள்",
    customerGrowth: "வாடிக்கையாளர் வளர்ச்சி",
    revenueByPaymentMethod: "பணம் செலுத்தும் முறை மூலம் வருவாய்",
    dailyVisitors: "தினசரி பார்வையாளர்கள்",
    stockLevels: "ஸ்டாக் நிலைகள்",
    outOfStock: "ஸ்டாக் இல்லை",
    lowStock: "குறைந்த ஸ்டாக்",
    inStock: "ஸ்டாக்கில் உள்ளது",
    weeklyTrends: "வாராந்திர போக்குகள்",
    performanceMetrics: "செயல்திறன் அளவீடுகள்",
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('userLanguage');
    return savedLanguage || 'en';
  });

  useEffect(() => {
    localStorage.setItem('userLanguage', language);
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(prevLang => prevLang === 'en' ? 'ta' : 'en');
  }, []);

  const t = useCallback((key) => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);