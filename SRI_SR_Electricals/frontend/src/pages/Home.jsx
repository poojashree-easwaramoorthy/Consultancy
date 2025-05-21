import React from 'react';
import { Link } from 'react-router-dom';
import { useProduct } from '@/context/ProductContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingCart, Heart, Award, Truck, Clock, Shield } from 'lucide-react';

const Home = () => {
  const { products, addToCart, toggleFavorite } = useProduct();
  const { t } = useLanguage();

  // Get featured products (first 4)
  const featuredProducts = products.slice(0, 4);

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="hero-section py-20 relative min-h-[500px] bg-fixed bg-cover bg-center" 
        style={{ 
          backgroundImage: 'url("/z.jpg")', 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-70"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
              {t('welcomeMessage')}
            </h1>
            <p className="text-xl mb-8 animate-fade-in delay-200">{t('heroSubtitle')}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/products">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-2 text-lg">
                  {t('shopNow')}
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-gray-900 px-8 py-2 text-lg">
                  {t('about')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('whyChooseSR')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { icon: <Award />, title: t('qualityProducts'), desc: t('qualityDescription') },
              { icon: <Truck />, title: t('fastDelivery'), desc: t('deliveryDescription') },
              { icon: <Shield />, title: t('safeReliable'), desc: t('safeDescription') },
              { icon: <Clock />, title: t('support'), desc: t('supportDescription') },
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {React.cloneElement(feature.icon, { className: "h-8 w-8 text-white" })}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">{t('featuredProducts')}</h2>
            <Link to="/products" className="text-blue-500 hover:text-blue-700 flex items-center">
              {t('viewMore')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <div 
                key={product.id} 
                className="product-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
              >
                <Link to={`/products/${product.id}`}>
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x300/e2e8f0/1e293b?text=SR+Electricals';
                      }}
                    />
                  </div>
                </Link>
                
                <div className="p-4">
                  <Link to={`/products/${product.id}`}>
                    <h3 className="text-lg font-semibold mb-2 hover:text-blue-500 transition-colors">{product.name}</h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-3">{t(product.category)}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">₹{product.price.toFixed(2)}</span>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleFavorite(product.id)}
                        className={`${product.isFavorite ? 'text-red-500 border-red-500' : ''}`}
                      >
                        <Heart className={`h-4 w-4 ${product.isFavorite ? 'fill-current text-red-500' : ''}`} />
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
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('shopByCategory')}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['lighting', 'wiring', 'switches', 'safety', 'solar', 'tools'].map((category) => (
              <Link 
                to={`/products?category=${category}`} 
                key={category}
                className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
              >
                <div className="mb-4 h-16 flex items-center justify-center">
                  <img 
                    src={`/category-${category}.jpg`} 
                    alt={category}
                    className="h-12 w-12"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/100/e2e8f0/1e293b?text=' + category.charAt(0).toUpperCase();
                    }}
                  />
                </div>
                <h3 className="font-medium capitalize">{t(category)}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">{t('readyToUpgrade')}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {t('browseCatalog')}
          </p>
          <Link to="/products">
            <Button variant="outline" className="bg-white text-blue-500 hover:bg-gray-100 hover:text-blue-700 px-8 py-2 text-lg">
              {t('shopNow')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('customerSay')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Poojashree', review: t('testimonial1') },
              { name: 'Santhapriyan', review: t('testimonial2') },
              { name: 'Surya', review: t('testimonial3') },
            ].map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
              >
                <div className="stars mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4">{testimonial.review}</p>
                <div className="font-semibold">- {testimonial.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;