const express = require("express");
const router = express.Router();
const { createCheckoutSession, webhook } = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

// We avoid 'protect' middleware for the Webhook because Stripe calls it externally
router.post("/webhook", webhook);

router.post("/create-checkout-session", protect, createCheckoutSession);
router.get("/verify-session/:sessionId", protect, require("../controllers/paymentController").verifySession);

module.exports = router;
