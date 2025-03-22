const simulatedReaderConfig = {
  // Test card numbers for simulated payments
  testCards: {
    visa: '4242424242424242',
    mastercard: '5555555555554444',
    amex: '378282246310005',
    discover: '6011111111111117'
  },
  
  // Default simulated reader settings
  defaultReader: {
    registration_code: 'simulated-code',
    label: 'Test Reader',
    location: "london" // Optional location ID
  },

  // Test mode configuration
  testMode: {
    isEnabled: true,
    simulatePaymentDelay: 2000, // ms to simulate payment processing
    defaultCurrency: 'usd'
  }
};

module.exports = simulatedReaderConfig;