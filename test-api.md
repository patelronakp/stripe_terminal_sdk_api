# API Testing Guide with cURL

## Prerequisites
- Replace `YOUR_API_URL` with your actual API base URL (e.g., http://localhost:3000/api)
- Replace `READER_ID` with your actual reader ID after registration
- Replace `PAYMENT_INTENT_ID` with the ID received from create-payment-intent response

## Test Mode
This API supports simulated readers for testing without physical POS devices. Use the following test card numbers:

- Visa: 4242424242424242
- Mastercard: 5555555555554444
- American Express: 378282246310005
- Discover: 6011111111111117

## Reader Management

### List All Readers
```bash
curl -X GET "YOUR_API_URL/readers" \
  -H "Content-Type: application/json"
```

### Register a New Reader

#### Physical Reader
```bash
curl -X POST "YOUR_API_URL/readers/register" \
  -H "Content-Type: application/json" \
  -d '{
    "registration_code": "READER_REGISTRATION_CODE",
    "label": "Main Store Reader"
  }'
```

#### Simulated Reader (Test Mode)
```bash
curl -X POST "YOUR_API_URL/readers/register" \
  -H "Content-Type: application/json" \
  -d '{
    "simulated": true,
    "label": "Test Reader"
  }'
```

### Get Reader Status
```bash
curl -X GET "YOUR_API_URL/readers/READER_ID" \
  -H "Content-Type: application/json"
```

## Payment Processing

### Create Payment Intent

#### Physical Reader
```bash
curl -X POST "YOUR_API_URL/payments/create-payment-intent" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "usd",
    "readerId": "READER_ID"
  }'
```

#### Simulated Reader (Test Mode)
```bash
curl -X POST "YOUR_API_URL/payments/create-payment-intent" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "usd",
    "readerId": "READER_ID",
    "simulated": true
  }'
```

### Process Payment on Reader
```bash
curl -X POST "YOUR_API_URL/payments/process-payment/READER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_intent": "PAYMENT_INTENT_ID"
  }'
```

### Capture Payment
```bash
curl -X POST "YOUR_API_URL/payments/capture-payment/PAYMENT_INTENT_ID" \
  -H "Content-Type: application/json"
```

### Cancel Payment
```bash
curl -X POST "YOUR_API_URL/payments/cancel-payment/PAYMENT_INTENT_ID" \
  -H "Content-Type: application/json"
```

## Example Flow

### Physical Reader
1. List readers to check available devices
2. Register a new reader with registration code
3. Create a payment intent with the reader ID
4. Process the payment intent on the terminal reader
5. After the customer completes the payment on the terminal, capture the payment
6. If needed, cancel the payment before capture

### Simulated Reader (Test Mode)
1. Register a simulated reader (no registration code needed)
2. Create a payment intent with simulated=true
3. Process the payment intent on the simulated reader
4. Use one of the test card numbers to simulate the payment
5. Capture the payment to complete the transaction
6. If needed, cancel the payment before capture

## Notes
- All amounts are in cents (e.g., 1000 = $10.00)
- The default currency is USD
- Ensure the reader is online before creating a payment intent
- Payment intents must be captured within 7 days