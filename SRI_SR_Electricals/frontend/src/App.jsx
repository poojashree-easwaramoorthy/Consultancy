import React from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { ProductProvider } from '@/context/ProductContext';

const App = () => {
  const navigate = useNavigate();

  return (
    <Router>
      <ProductProvider navigateCallback={navigate}>
        {/* ...existing components... */}
      </ProductProvider>
    </Router>
  );
};

export default App;
