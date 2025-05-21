const API_URL = import.meta.env.VITE_API_URL;

const apiBridge = {
  // src/services/apiBridge.js
async placeOrder(orderData, token) {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
  
    const responseData = await response.json();
  
    if (!response.ok) {
      console.error('Order failed:', responseData);
      throw new Error(responseData.message || 'Failed to place order');
    }
  
    return responseData; // Ensure this contains orderId
  }
};

export default apiBridge;