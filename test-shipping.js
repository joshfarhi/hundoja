// Test script for shipping calculation
const testShippingCalculation = async () => {
  const testData = {
    address: {
      line1: "123 Main St",
      city: "New York",
      state: "AK",
      postal_code: "10001",
      country: "US"
    },
    items: [
      { id: "1", quantity: 1, price: 50 }
    ]
  };

  console.log('Testing shipping calculation...');
  console.log('Items total: $', testData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0));

  try {
    const response = await fetch('http://localhost:3000/api/shipping-calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Shipping calculation result:', result);
    } else {
      console.error('API call failed:', response.status);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run test
testShippingCalculation();
