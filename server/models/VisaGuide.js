const mongoose = require("mongoose");

const VisaGuideSchema = new mongoose.Schema(
  {
    country: { type: String, required: true },
    countryFlag: { type: String },
    visaType: { type: String, required: true },
    processingTime: { type: String },
    cost: { type: String },
    requirements: { type: [String], default: [] },
    steps: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VisaGuide", VisaGuideSchema);
