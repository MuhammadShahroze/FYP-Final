const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");

// @desc    Create Stripe Checkout Session
// @route   POST /api/payments/create-checkout-session
// @access  Private (Student)
exports.createCheckoutSession = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "student") {
      return res.status(400).json({ success: false, message: "Only students can subscribe" });
    }

    // Create session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Pro Subscription",
              description: "Unlock direct applications, AI matching, and visa guidance.",
            },
            unit_amount: 9900, // $99.00
          },
          quantity: 1,
        },
      ],
      mode: "payment", // or 'subscription' if we want recurring
      success_url: `${process.env.FRONTEND_URL}/dashboard/subscription?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription?status=cancel`,
      client_reference_id: req.user.id,
      customer_email: user.email,
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Session Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Stripe Session
// @route   GET /api/payments/verify-session/:sessionId
// @access  Private (Student)
exports.verifySession = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    if (session.payment_status === "paid" && session.client_reference_id === req.user.id) {
      await User.findByIdAndUpdate(req.user.id, {
        studentTier: "pro",
        subscriptionStatus: "active",
      });
      return res.status(200).json({ success: true, message: "Subscription activated" });
    }

    res.status(400).json({ success: false, message: "Payment not verified" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Stripe Webhook
// @route   POST /api/payments/webhook
// @access  Public
exports.webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn("⚠️ STRIPE_WEBHOOK_SECRET is missing. Bypassing signature verification for testing.");
      event = req.body; // Use parsed body directly in test mode
    } else {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    }
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;

    try {
      await User.findByIdAndUpdate(userId, {
        studentTier: "pro",
        subscriptionStatus: "active",
      });
      console.log(`User ${userId} upgraded to PRO`);
    } catch (error) {
      console.error("Error updating user after payment:", error.message);
    }
  }

  res.status(200).json({ received: true });
};
