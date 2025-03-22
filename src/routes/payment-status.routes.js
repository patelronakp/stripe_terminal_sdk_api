const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * @swagger
 * /api/payment-status/{paymentIntentId}:
 *   get:
 *     summary: Get the current status of a payment intent
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment intent to check
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 payment_intent:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     payment_method:
 *                       type: string
 *                     created:
 *                       type: number
 *                     metadata:
 *                       type: object
 *       404:
 *         description: Payment intent not found
 *       500:
 *         description: Server error
 */
router.get("/:paymentIntentId", async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return res.status(404).json({
        status: "error",
        message: "Payment intent not found",
      });
    }

    res.status(200).json({
      status: "success",
      payment_intent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method,
        created: paymentIntent.created,
        metadata: paymentIntent.metadata,
        last_payment_error: paymentIntent.last_payment_error
      },
    });
  } catch (error) {
    console.error("Error retrieving payment status:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

module.exports = router;