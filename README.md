# Stripe Payment POS Backend

A Node.js backend API for handling Stripe payments with BBPOS WisePOS E device integration. This server provides endpoints for donation processing and payment verification.

## Features

- Payment intent creation for card-present transactions
- Payment capture and verification
- Webhook handling for real-time payment status updates
- Secure environment configuration
- CORS and security middleware integration

## Prerequisites

- Node.js (v14 or higher)
- Stripe account with API keys
- BBPOS WisePOS E device

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update with your Stripe API keys:
   ```
   STRIPE_SECRET_KEY=your_stripe_secret_key_here
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
   ```

## API Endpoints

### Create Payment Intent
- **POST** `/api/payments/create-payment-intent`
- Body: `{ "amount": number, "currency": string }`

### Capture Payment
- **POST** `/api/payments/capture-payment/:paymentIntentId`

### Cancel Payment
- **POST** `/api/payments/cancel-payment/:paymentIntentId`

### Webhook
- **POST** `/api/payments/webhook`
- Handles Stripe webhook events for payment status updates

## Development

Start the development server:
```bash
npm run dev
```

For production:
```bash
npm start
```

## Security

- Uses helmet for enhanced API security
- CORS configuration for allowed origins
- Environment variables for sensitive data
- Request validation and error handling

## Error Handling

The API implements centralized error handling with appropriate HTTP status codes and error messages. In development mode, detailed error information is provided.