const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const simulatedReaderConfig = require("../config/simulated-reader");

/**
 * @swagger
 * /api/readers:
 *   get:
 *     summary: Get all terminal readers
 *     tags: [Readers]
 *     responses:
 *       200:
 *         description: List of all readers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 readers:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const readers = await stripe.terminal.readers.list();
    res.status(200).json({
      status: "success",
      readers: readers.data,
    });
  } catch (error) {
    console.error("Error fetching readers:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/readers/register:
 *   post:
 *     summary: Register a new terminal reader
 *     tags: [Readers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registration_code
 *             properties:
 *               registration_code:
 *                 type: string
 *                 description: Registration code for the reader
 *               label:
 *                 type: string
 *                 description: Label for the reader
 *               location:
 *                 type: string
 *                 description: Location identifier for the reader
 *     responses:
 *       200:
 *         description: Reader registered successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post("/register", async (req, res) => {
  try {
    const { registration_code, label, location, simulated = false } = req.body;

    // Determine the registration code based on whether simulation is enabled
    const regCode = simulated ? "simulated-wpe" : registration_code;

    // Validate the registration code
    if (!regCode) {
      return res.status(400).json({
        status: "error",
        message: "Registration code is required for physical readers",
      });
    }

    // Set up reader parameters
    const readerParams = {
      registration_code: regCode,
      label: label || (simulated ? "Simulated Reader" : undefined),
      location: location || (simulated ? "test_mode" : undefined),
    };

    // Create the reader
    const reader = await stripe.terminal.readers.create(readerParams);

    // Respond with the created reader
    res.status(201).json({
      status: "success",
      reader,
    });
  } catch (error) {
    console.error("Error registering reader:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Get reader status
router.get("/:readerId", async (req, res) => {
  try {
    const { readerId } = req.params;
    const reader = await stripe.terminal.readers.retrieve(readerId);

    res.status(200).json({
      status: "success",
      reader,
    });
  } catch (error) {
    console.error("Error fetching reader:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

module.exports = router;
