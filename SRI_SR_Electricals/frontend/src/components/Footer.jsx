
import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">SR Electricals</h3>
            <p className="text-gray-300 mb-4">
              Your trusted partner for all electrical needs since 1995. Quality products, expert advice, and exceptional service.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-srorange transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-srorange transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-srorange transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-srorange transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-srorange transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-gray-300 hover:text-srorange transition-colors">About Us</Link></li>
              <li><Link to="/products" className="text-gray-300 hover:text-srorange transition-colors">Products</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-srorange transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="text-xl font-bold mb-4">Product Categories</h3>
            <ul className="space-y-2">
              <li><Link to="/products?category=lighting" className="text-gray-300 hover:text-srorange transition-colors">Lighting</Link></li>
              <li><Link to="/products?category=wiring" className="text-gray-300 hover:text-srorange transition-colors">Wiring & Cables</Link></li>
              <li><Link to="/products?category=switches" className="text-gray-300 hover:text-srorange transition-colors">Switches & Controls</Link></li>
              <li><Link to="/products?category=safety" className="text-gray-300 hover:text-srorange transition-colors">Safety Equipment</Link></li>
              <li><Link to="/products?category=solar" className="text-gray-300 hover:text-srorange transition-colors">Solar Products</Link></li>
              <li><Link to="/products?category=tools" className="text-gray-300 hover:text-srorange transition-colors">Tools</Link></li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-srorange mt-1" />
                <p className="text-gray-300">Sri Pavun Complex,High School road,Chinnalapatti,Dindigul-624301</p>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-srorange" />
                <p className="text-gray-300">+91 9150532902</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-srorange" />
                <p className="text-gray-300">srisrelectrical@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} SR Electricals. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-gray-400 hover:text-srorange transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-srorange transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
