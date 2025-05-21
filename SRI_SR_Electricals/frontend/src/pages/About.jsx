import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Check, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const About = () => {
  return (
    <div>
      {/* Hero Section */}
      <section
        className="about-hero py-20 h-[500px] bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('/p.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-70"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About SR Electricals</h1>
            <p className="text-xl mb-8">
              Your trusted partner for quality electrical solutions since 1995
            </p>
          </div>
        </div>
      </section>

      {/* About Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-700 mb-4">
                Founded in 1995 by Mr. S. Ramesh, SR Electricals began as a small electrical shop in the heart of the city. With a vision to provide quality electrical products and exceptional customer service, we've grown to become one of the region's most trusted electrical suppliers.
              </p>
              <p className="text-gray-700 mb-4">
                Over the past 30 years, we've expanded our product range to include everything from basic electrical supplies to cutting-edge smart home solutions. Our commitment to quality and customer satisfaction remains unwavering as we continue to evolve with changing technologies.
              </p>
              <p className="text-gray-700">
                Today, SR Electricals serves thousands of customers, from homeowners to large commercial projects, providing them with reliable electrical products that meet the highest safety standards.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
              <img 
                src="/v.jpg" 
                alt="SR Electricals store" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x400/e2e8f0/1e293b?text=SR+Electricals+Store';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Mission & Values</h2>
            <p className="text-gray-700 max-w-3xl mx-auto">
              We're guided by our commitment to excellence, safety, and customer satisfaction in everything we do.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Quality First", desc: "We never compromise on the quality of our products. Every item we sell meets rigorous safety and performance standards.", color: "from-blue-500 to-purple-500" },
              { title: "Customer Centric", desc: "Your satisfaction is our top priority. We strive to exceed expectations with exceptional service and support.", color: "from-green-500 to-teal-500" },
              { title: "Innovation", desc: "We continuously update our inventory with the latest electrical technologies and energy-efficient solutions.", color: "from-yellow-500 to-orange-500" },
            ].map((value, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
              >
                <div className={`bg-gradient-to-r ${value.color} h-16 w-16 rounded-full flex items-center justify-center mb-4`}>
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Leadership Team</h2>
            <p className="text-gray-700 max-w-3xl mx-auto">
              Meet the experts who drive our mission forward every day.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Sureshkumar', role: 'Founder', image: '/team-1.jpg' },
              { name: 'Rajaganesh', role: 'Worker', image: '/team-3.jpg' },
              { name: 'Meena', role: 'Worker', image: '/team-4.jpg' },
            ].map((member, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
              >
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://placehold.co/600x600/e2e8f0/1e293b?text=${member.name.charAt(0)}`;
                    }}
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-xl font-semibold mb-1 text-gray-800">{member.name}</h3>
                  <p className="text-gray-600">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Achievements</h2>
            <p className="max-w-3xl mx-auto">
              Recognized for excellence in service and product quality.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { count: "25+", label: "Years in Business" },
              { count: "10K+", label: "Happy Customers" },
              { count: "500+", label: "Products" },
              { count: "5", label: "Industry Awards" },
            ].map((achievement, index) => (
              <div key={index} className="text-center">
                <Award className="h-16 w-16 mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2">{achievement.count}</div>
                <p>{achievement.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-gray-700 max-w-3xl mx-auto">
              Have questions or need assistance? Our team is here to help!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Phone />, title: "Call Us", desc: "+91 9150532902", subDesc: "Monday - Saturday: 9AM - 8PM" },
              { icon: <Mail />, title: "Email Us", desc: "srisrelectrical@gmail.com", subDesc: "We respond within 24 hours" },
              { icon: <MapPin />, title: "Visit Us", desc: "Sri Pavun Complex, High School Road, Chinnalapatti, Dindigul-624301", subDesc: "Showroom: 10AM - 7PM" },
            ].map((contact, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 text-center"
              >
                <div className="text-srblue mb-4">{contact.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{contact.title}</h3>
                <p className="text-gray-600 mb-4">{contact.desc}</p>
                <p className="text-gray-600">{contact.subDesc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/contact">
              <Button className="bg-blue-500 hover:bg-blue-700 px-8 py-2 text-white">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;