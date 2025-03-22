const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Stripe Payment POS API',
      version: '1.0.0',
      description: 'API documentation for Stripe Payment POS Backend with BBPOS WisePOS E device integration. Supports both physical and simulated readers for testing.',
    },
    servers: [
      {
        url: '{protocol}://{host}',
        description: 'Development server',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'http'
          },
          host: {
            default: '192.168.0.10:3000',
            description: 'Your host address (e.g. localhost:3000 or 192.168.1.100:3000)'
          }
        }
      },
      {
        url: '{protocol}://{host}',
        description: 'Development local server',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'http'
          },
          host: {
            default: 'localhost:3000',
            description: 'Your host address (e.g. localhost:3000 or 192.168.1.100:3000)'
          }
        }
      },
      {
        url: '{protocol}://{host}',
        description: 'ngrock server',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'http'
          },
          host: {
            default: '3658-183-83-147-177.ngrok-free.app',
            description: 'Your host address (e.g. localhost:3000 or 192.168.1.100:3000)'
          }
        }
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              example: 'Error message details'
            }
          }
        },
        Reader: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'tmr_xxxxx'
            },
            label: {
              type: 'string',
              example: 'Main Store Reader'
            },
            status: {
              type: 'string',
              enum: ['online', 'offline'],
              example: 'online'
            }
          }
        },
        PaymentIntent: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'pi_xxxxx'
            },
            amount: {
              type: 'integer',
              example: 1000
            },
            currency: {
              type: 'string',
              example: 'usd'
            },
            status: {
              type: 'string',
              enum: ['requires_payment_method', 'requires_confirmation', 'requires_capture', 'canceled', 'succeeded'],
              example: 'requires_capture'
            }
          }
        }
      },
      securitySchemes: {
        stripeSecretKey: {
          type: 'apiKey',
          in: 'header',
          name: 'stripe-secret-key',
          description: 'Your Stripe Secret Key'
        }
      }
    },
    tags: [
      {
        name: 'Readers',
        description: 'Terminal reader management endpoints'
      },
      {
        name: 'Payments',
        description: 'Payment processing endpoints'
      }
    ],
    security: [
      {
        stripeSecretKey: []
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

// Test card numbers for simulated payments
const testCards = {
  visa: '4242424242424242',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  discover: '6011111111111117'
};

// Add test cards to the API documentation
options.definition.info.description += `\n\nTest Mode Card Numbers:\n${Object.entries(testCards).map(([brand, number]) => `- ${brand.charAt(0).toUpperCase() + brand.slice(1)}: ${number}`).join('\n')}`

module.exports = swaggerJsdoc(options);