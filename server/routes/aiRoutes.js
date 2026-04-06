const express = require("express");
const router = express.Router();
const { getAIGuidance } = require("../controllers/aiController");
const { protect } = require("../middleware/auth");

router.post("/chat", protect, getAIGuidance);

module.exports = router;
