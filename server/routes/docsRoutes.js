const express = require("express");
const VisaGuide = require("../models/VisaGuide");
const Template = require("../models/Template");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// --- Visa Guides ---
router.get("/visas", async (req, res) => {
  try {
    const guides = await VisaGuide.find();
    res.status(200).json({ success: true, data: guides });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/visas", protect, authorize("admin"), async (req, res) => {
  try {
    const guide = await VisaGuide.create(req.body);
    res.status(201).json({ success: true, data: guide });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete("/visas/:id", protect, authorize("admin"), async (req, res) => {
  try {
    await VisaGuide.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// --- Document Templates ---
router.get("/templates", async (req, res) => {
  try {
    const templates = await Template.find();
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/templates", protect, authorize("admin"), async (req, res) => {
  try {
    const template = await Template.create(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
