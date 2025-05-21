import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduct } from '@/context/ProductContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Heart, ShoppingCart, ArrowRight, Star, Edit, Truck, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VoiceSearch from '@/components/VoiceSearch';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import cartService from '@/services/cartService';

const ProductDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { 
    products, 
    addToCart, 
    toggleFavorite, 
    isLoggedIn, 
    user, 
    addReview, 
    updateReview, 
    currentReview, 
    setCurrentReview,
    storeSettings,
    prepareCheckoutNavigation,
    getProductById
  } = useProduct();
  
  // Add state for direct favorite management
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Check favorite status directly from API
  const checkFavoriteStatus = async (productId) => {
    if (!isLoggedIn || !productId) return;
    
    try {
      setFavoriteLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/favorites/check/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setIsFavorite(response.data.isFavorite);
      console.log(`Product ${productId} favorite status:`, response.data.isFavorite);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Handle toggling favorite directly with API
  const handleToggleFavorite = async (productId) => {
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please log in to add favorites",
        variant: "default",
      });
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    
    try {
      setFavoriteLoading(true);
      const token = localStorage.getItem('token');
      
      if (isFavorite) {
        // Remove from favorites
        await axios.delete(`${API_BASE_URL}/api/favorites/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setIsFavorite(false);
        toast({
          title: "Success",
          description: "Removed from favorites",
        });
      } else {
        // Add to favorites
        await axios.post(`${API_BASE_URL}/api/favorites`, {
          productId
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setIsFavorite(true);
        toast({
          title: "Success",
          description: "Added to favorites",
        });
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Updated useEffect to handle missing product ID and check favorite status
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setProduct(null); // Clear current product while loading
        
        if (!id) {
          console.error("Product ID is missing");
          toast({
            title: "Error",
            description: "Product information is missing",
            variant: "destructive",
          });
          navigate('/products');
          return;
        }
        
        if (products.length > 0) {
          // Try to find the product in local state using multiple ID formats
          const foundProduct = products.find(p => 
            p.id?.toString() === id?.toString() || 
            p._id?.toString() === id?.toString()
          );
          
          if (foundProduct) {
            console.log("Found product in local state:", foundProduct);
            setProduct(foundProduct);
            return;
          }
        }
        
        // If not found in local state or products not yet loaded, fetch from API
        console.log(`Product not found in local state, fetching ID: ${id}`);
        const fetchedProduct = await getProductById(id);
        
        if (fetchedProduct) {
          setProduct(fetchedProduct);
        } else {
          // Handle case where product couldn't be loaded
          toast({
            title: "Product Not Found",
            description: "We couldn't find the product you're looking for.",
            variant: "destructive",
          });
          navigate('/products'); // Redirect to products page
        }
      } catch (error) {
        console.error("Error loading product:", error);
        navigate('/products');
        toast({
          title: "Error",
          description: "Something went wrong while loading the product.",
          variant: "destructive",
        });
      }
    };

    if (id) {
      loadProduct();
    } else {
      navigate('/products');
    }
  }, [id, getProductById, products, navigate, toast]);

  // Check favorite status whenever product or login state changes
  useEffect(() => {
    if (product && isLoggedIn) {
      const productId = product._id || product.id;
      checkFavoriteStatus(productId);
    }
  }, [product, isLoggedIn]);

  useEffect(() => {
    if (searchTerm && products.length > 0) {
      const foundProduct = products.find(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (foundProduct) {
        navigate(`/products/${foundProduct.id}`);
        toast({
          title: "Product Found",
          description: `Found: ${foundProduct.name}`,
        });
      } else {
        toast({
          title: "Product Not Found",
          description: `No product matches: "${searchTerm}"`,
          variant: "destructive",
        });
      }
    }
  }, [searchTerm, products, navigate, toast]);

  // Update the loading state to be more informative
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Loading product...</h2>
        <p className="text-gray-500">Please wait while we fetch the product details</p>
      </div>
    );
  }

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    setQuantity(Math.max(1, value));
  };

  const handleAddToCart = async () => {
    try {
      // Add to local context first for immediate feedback
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
      
      // If logged in, also add to server cart
      if (isLoggedIn) {
        try {
          await cartService.addToCart(product, quantity);
          console.log(`Added ${quantity} ${product.name} to server cart`);
        } catch (error) {
          console.error('Error adding to server cart:', error);
        }
      }
      
      toast({
        title: "Added to Cart",
        description: `${quantity} × ${product.name} added to your cart`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please log in to continue with checkout",
        variant: "default",
      });
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    
    // Check if any payment methods are enabled before proceeding
    const anyPaymentMethodEnabled = 
      (storeSettings?.enableCod ?? true) || 
      (storeSettings?.enableRazorpay ?? true) || 
      (storeSettings?.enableUpi ?? true);
    
    if (!anyPaymentMethodEnabled) {
      toast({
        title: "Payment Methods Unavailable",
        description: "No payment methods are currently enabled. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    // Create checkout data directly instead of using prepareCheckoutNavigation
    const checkoutData = {
      buyNow: true,
      product: { 
        ...product,
        quantity: quantity
      }
    };
    
    console.log("Navigating to checkout with data:", checkoutData);
    
    // Navigate to checkout with the product data
    navigate('/checkout', { 
      state: checkoutData,
      replace: false // Make sure this is a new history entry
    });
  };

  const handleReviewSubmit = () => {
    if (isEditingReview) {
      updateReview(product.id, editingReviewId, { rating, comment });
      setIsEditingReview(false);
      setEditingReviewId(null);
    } else {
      addReview(product.id, { rating, comment });
    }
    setRating(0);
    setComment('');
    setIsDialogOpen(false);
  };

  const startEditReview = (review) => {
    setRating(review.rating);
    setComment(review.comment);
    setIsEditingReview(true);
    setEditingReviewId(review.id);
    setIsDialogOpen(true);
  };

  const handleOpenReviewDialog = () => {
    setRating(0);
    setComment('');
    setIsEditingReview(false);
    setEditingReviewId(null);
    setIsDialogOpen(true);
  };

  const handleVoiceSearchResult = (result) => {
    setSearchTerm(result);
  };

  // Calculate average rating
  const averageRating = product.reviews.length > 0
    ? (product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Voice Search */}
      <div className="mb-6 flex justify-end">
        <VoiceSearch onResult={handleVoiceSearchResult} />
      </div>
      
      {/* Product Detail Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="bg-white rounded-lg overflow-hidden shadow-md">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-contain p-4"
            style={{ maxHeight: '500px' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/600x400/e2e8f0/1e293b?text=SR+Electricals';
            }}
          />
        </div>
        
        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-center mb-4">
            <div className="flex items-center mr-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-4 w-4 ${parseFloat(averageRating) >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="text-gray-600">
              {averageRating} ({product.reviews.length} reviews)
            </span>
          </div>
          
          <div className="text-2xl font-bold text-srblue mb-4">₹{product.price.toFixed(2)}</div>
          <p className="text-gray-700 mb-6">{product.description}</p>
          
          <div className="flex items-center mb-6">
            <span className="mr-4 text-gray-700">{t('category')}:</span>
            <span className="capitalize bg-gray-100 px-3 py-1 rounded-full text-sm">{product.category}</span>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <Truck className="h-5 w-5 text-srblue mr-2" />
              <span className="text-gray-700">{t('freeDelivery')}</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-srblue mr-2" />
              <span className="text-gray-700">{t('warranty')}</span>
            </div>
          </div>
          
          <div className="flex items-center mb-6">
            <div className="mr-4">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                {t('quantity')}
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-16 border border-gray-300 rounded-md p-2 text-center"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-srblue hover:bg-blue-700"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {t('addToCart')}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleToggleFavorite(product._id || product.id)}
              className={`flex-1 ${isFavorite ? 'text-red-500 border-red-500' : ''}`}
              disabled={favoriteLoading}
            >
              <Heart className={`mr-2 h-5 w-5 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
              {isFavorite ? t('removeFromWishlist') : t('addToWishlist')}
            </Button>
            
            <Button 
              onClick={handleBuyNow}
              className="w-full bg-srorange hover:bg-orange-600 mt-2"
              disabled={!isLoggedIn || !(
                (storeSettings?.enableCod ?? true) || 
                (storeSettings?.enableRazorpay ?? true) || 
                (storeSettings?.enableUpi ?? true)
              )}
            >
              {t('buyNow')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tabs Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-12">
        <Tabs defaultValue="description">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="description">{t('description')}</TabsTrigger>
            <TabsTrigger value="specifications">{t('specifications')}</TabsTrigger>
            <TabsTrigger value="reviews">{t('reviews')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description">
            <div className="text-gray-700">
              <h3 className="text-xl font-semibold mb-4">{t('productDescription')}</h3>
              <p className="mb-4">{product.description}</p>
              <p>SR Electricals offers high-quality electrical products that are built to last. Our {product.name} is designed for optimal performance and safety. We stand behind the quality of our products with a 1-year warranty.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="specifications">
            <div>
              <h3 className="text-xl font-semibold mb-4">{t('technicalSpecifications')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-b pb-2">
                  <span className="font-semibold">{t('productName')}:</span> {product.name}
                </div>
                <div className="border-b pb-2">
                  <span className="font-semibold">{t('category')}:</span> {product.category}
                </div>
                <div className="border-b pb-2">
                  <span className="font-semibold">{t('modelNumber')}:</span> SR-{product.id}000
                </div>
                <div className="border-b pb-2">
                  <span className="font-semibold">{t('warranty')}:</span> 1 Year
                </div>
                <div className="border-b pb-2">
                  <span className="font-semibold">{t('countryOfOrigin')}:</span> India
                </div>
                <div className="border-b pb-2">
                  <span className="font-semibold">{t('returnPolicy')}:</span> 30 Days
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">{t('customerReviews')}</h3>
                {isLoggedIn && (
                  <Button onClick={handleOpenReviewDialog} className="bg-srblue hover:bg-blue-700">
                    {t('writeReview')}
                  </Button>
                )}
              </div>
              
              {/* Review List */}
              {product.reviews.length > 0 ? (
                <div className="space-y-6">
                  {product.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-4 w-4 ${review.rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <p className="font-semibold">{review.userName}</p>
                        </div>
                        {isLoggedIn && user.id === review.userId && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => startEditReview(review)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {t('editReview')}
                          </Button>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {new Date(review.date).toLocaleDateString()}
                      </p>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">{t('noReviews')}</p>
                  {!isLoggedIn && (
                    <Link to="/login">
                      <Button variant="outline">
                        {t('loginToReview')}
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Related Products */}
      <div>
        <h2 className="text-2xl font-bold mb-6">{t('relatedProducts')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products
            .filter(p => p.category === product.category && p.id !== product.id)
            .slice(0, 4)
            .map(relatedProduct => (
              <div key={relatedProduct.id} className="product-card bg-white rounded-lg overflow-hidden shadow-md">
                <Link to={`/products/${relatedProduct.id}`}>
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={relatedProduct.image} 
                      alt={relatedProduct.name} 
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x300/e2e8f0/1e293b?text=SR+Electricals';
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-md font-semibold hover:text-srblue transition-colors">{relatedProduct.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold">₹{relatedProduct.price.toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
        </div>
      </div>
      
      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingReview ? t('editReview') : t('writeReview')}</DialogTitle>
            <DialogDescription>
              {t('shareThoughts')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rating')}
              </label>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-6 w-6 cursor-pointer ${rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                {t('yourReview')}
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review here..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleReviewSubmit} 
              disabled={rating === 0 || comment.trim() === ''}
              className="bg-srblue hover:bg-blue-700"
            >
              {isEditingReview ? t('updateReview') : t('submitReview')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;