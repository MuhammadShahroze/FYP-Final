require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({
  limit: '5mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/payments/webhook')) {
      req.rawBody = buf;
    }
  }
}));

// Connect to Database
connectDB();

// Basic route for testing
app.get("/", (req, res) => {
  res.send("EduDuctor API is running");
});

// Define Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/programs", require("./routes/programRoutes"));
app.use("/api/scholarships", require("./routes/scholarshipRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/recommendations", require("./routes/recommendationsRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api", require("./routes/docsRoutes")); // handles /api/visas and /api/templates

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message || "Server Error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
