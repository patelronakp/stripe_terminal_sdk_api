const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const simulatedReaderConfig = require('../config/simulated-reader');

/**
 * @swagger
 * /api/payments/create-payment-intent:
 *   post:
 *     summary: Create a payment intent for a specific reader
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - readerId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in cents
 *               currency:
 *                 type: string
 *                 default: usd
 *                 description: Currency code
 *               readerId:
 *                 type: string
 *                 description: ID of the terminal reader
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Reader not found
 *       500:
 *         description: Server error
 */

// Create a payment intent for a specific reader
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = simulatedReaderConfig.testMode.defaultCurrency, readerId, simulated = false } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Valid amount is required",
      });
    }

    if (!readerId) {
      return res.status(400).json({
        status: "error",
        message: "Reader ID is required",
      });
    }

    // Verify reader exists
    const reader = await stripe.terminal.readers.retrieve(readerId);
    if (!reader) {
      return res.status(404).json({
        status: "error",
        message: "Reader not found",
      });
    }

    // For simulated readers, we don't need to check if it's online
    if (!simulated && reader.status !== 'online') {
      return res.status(400).json({
        status: "error",
        message: "Reader is not online",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: ["card_present"],
      capture_method: "manual", // For terminal payments
      metadata: { readerId }, // Store reader information
    });

    res.status(200).json({
      status: "success",
      paymentIntent,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/payments/capture-payment/{paymentIntentId}:
 *   post:
 *     summary: Capture a previously created payment intent
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment intent to capture
 *     responses:
 *       200:
 *         description: Payment captured successfully
 *       500:
 *         description: Server error
 */
router.post("/capture-payment/:paymentIntentId", async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    res.status(200).json({
      status: "success",
      paymentIntent,
    });
  } catch (error) {
    console.error("Error capturing payment:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/payments/cancel-payment/{paymentIntentId}:
 *   post:
 *     summary: Cancel a payment intent
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment intent to cancel
 *     responses:
 *       200:
 *         description: Payment cancelled successfully
 *       500:
 *         description: Server error
 */
router.post("/cancel-payment/:paymentIntentId", async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    res.status(200).json({
      status: "success",
      paymentIntent,
    });
  } catch (error) {
    console.error("Error canceling payment:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Handle Stripe webhook events
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook event processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle specific events
      let response = { received: true };
      
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          console.log("Payment succeeded:", paymentIntent.id);
          response = {
            received: true,
            status: "success",
            payment_intent: {
              id: paymentIntent.id,
              status: paymentIntent.status,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              payment_method: paymentIntent.payment_method,
              created: paymentIntent.created,
              metadata: paymentIntent.metadata
            }
          };
          break;
        case "payment_intent.payment_failed":
          const failedPayment = event.data.object;
          console.log("Payment failed:", failedPayment.id);
          response = {
            received: true,
            status: "failed",
            payment_intent: {
              id: failedPayment.id,
              status: failedPayment.status,
              amount: failedPayment.amount,
              currency: failedPayment.currency,
              error: failedPayment.last_payment_error,
              created: failedPayment.created,
              metadata: failedPayment.metadata
            }
          };
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
);

/**
 * @swagger
 * /api/payments/process-payment/{readerId}:
 *   post:
 *     summary: Process a payment intent on a specific terminal reader
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: readerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the terminal reader to process payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_intent
 *             properties:
 *               payment_intent:
 *                 type: string
 *                 description: ID of the payment intent to process
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 reader:
 *                   $ref: '#/components/schemas/Reader'
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Reader or payment intent not found
 *       500:
 *         description: Server error
 */
router.post("/process-payment/:readerId", async (req, res) => {
  try {
    const { readerId } = req.params;
    const { payment_intent } = req.body;

    if (!payment_intent) {
      return res.status(400).json({
        status: "error",
        message: "Payment intent ID is required",
      });
    }

    // Verify reader exists and is online
    const reader = await stripe.terminal.readers.retrieve(readerId);
    if (!reader) {
      return res.status(404).json({
        status: "error",
        message: "Reader not found",
      });
    }

    if (reader.status !== 'online') {
      return res.status(400).json({
        status: "error",
        message: "Reader is not online",
      });
    }

    // Process the payment intent on the terminal reader
    const processedReader = await stripe.terminal.readers.processPaymentIntent(
      readerId,
      {
        payment_intent,
      }
    );

    res.status(200).json({
      status: "success",
      reader: processedReader,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/payments/simulate-payment/{readerId}:
 *   post:
 *     summary: Simulate card presentation on a terminal reader (Test Mode Only)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: readerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the terminal reader to simulate payment
 *     responses:
 *       200:
 *         description: Payment simulation successful
 *       400:
 *         description: Invalid request or not in test mode
 *       404:
 *         description: Reader not found
 *       500:
 *         description: Server error
 */
router.post("/simulate-payment/:readerId", async (req, res) => {
  try {
    const { readerId } = req.params;

    // Verify reader exists
    const reader = await stripe.terminal.readers.retrieve(readerId);
    if (!reader) {
      return res.status(404).json({
        status: "error",
        message: "Reader not found",
      });
    }

    // Simulate card presentation
    const simulatedReader = await stripe.testHelpers.terminal.readers.presentPaymentMethod(readerId);

    res.status(200).json({
      status: "success",
      reader: simulatedReader,
    });
  } catch (error) {
    console.error("Error simulating payment:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/payments/create-and-process-payment/{readerId}:
 *   post:
 *     summary: Create and process a payment intent in a single call
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: readerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the terminal reader to process payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in cents
 *               currency:
 *                 type: string
 *                 default: usd
 *                 description: Currency code
 *               simulated:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to use simulated mode
 *     responses:
 *       200:
 *         description: Payment created and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 paymentIntent:
 *                   type: object
 *                 reader:
 *                   $ref: '#/components/schemas/Reader'
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Reader not found
 *       500:
 *         description: Server error
 */
router.post("/create-and-process-payment/:readerId", async (req, res) => {
  try {
    const { readerId } = req.params;
    const { amount, currency = simulatedReaderConfig.testMode.defaultCurrency, simulated = false } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Valid amount is required",
      });
    }

    // Verify reader exists
    const reader = await stripe.terminal.readers.retrieve(readerId);
    if (!reader) {
      return res.status(404).json({
        status: "error",
        message: "Reader not found",
      });
    }

    // For simulated readers, we don't need to check if it's online
    if (!simulated && reader.status !== 'online') {
      return res.status(400).json({
        status: "error",
        message: "Reader is not online",
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: ["card_present"],
      capture_method: "manual", // For terminal payments
      metadata: { readerId }, // Store reader information
    });

    // Process the payment intent on the terminal reader
    const processedReader = await stripe.terminal.readers.processPaymentIntent(
      readerId,
      {
        payment_intent: paymentIntent.id,
      }
    );

    res.status(200).json({
      status: "success",
      paymentIntent,
      reader: processedReader,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

module.exports = router;
