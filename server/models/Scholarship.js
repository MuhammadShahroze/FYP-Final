const mongoose = require("mongoose");

const ScholarshipSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    organization: { type: String, required: true }, // Cached from owner
    contactEmail: { type: String, required: true },
    country: { type: String },
    countryFlag: { type: String },
    
    type: { type: String, enum: ["Fully-Funded", "Partial", "Tuition Waiver"], required: true },
    amount: { type: String },
    deadline: { type: Date },
    status: { type: String, enum: ["active", "draft"], default: "draft" },
    
    degreeLevel: { type: String },
    subjectGroups: { type: [String], required: true },
    courseType: { type: String },
    
    cgpaRequirement: { type: Number },
    
    description: { type: String, required: true },
    requirements: { type: String },
    requiredDocuments: { type: [String], default: [] },
    
    // Analytics
    applicationsCount: { type: Number, default: 0 },
    acceptedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    rejectedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Scholarship", ScholarshipSchema);
