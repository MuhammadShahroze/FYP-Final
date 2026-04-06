const mongoose = require("mongoose");

const ProgramSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    university: { type: String, required: true }, // Cached name from owner
    contactEmail: { type: String, required: true },
    country: { type: String },
    countryFlag: { type: String },
    
    degreeLevel: { type: String, required: true },
    subjectGroups: { type: [String], required: true },
    courseType: { type: String },
    
    semester: { type: String },
    deadline: { type: Date },
    status: { type: String, enum: ["active", "draft"], default: "draft" },
    
    courseCode: { type: String },
    cgpaRequirement: { type: Number }, // Standardized to Number for easy < or > checks
    
    description: { type: String, required: true },
    applicationProcess: { type: String },
    requirements: { type: String },
    requiredDocuments: { type: [String], default: [] },
    
    tuitionFee: { type: String }, // Legacy field kept for backward compatibility
    semesterFee: { type: String },
    courseDuration: { type: String },
    courseLanguage: { type: String },
    location: { type: String },
    
    eligibilityLanguageRequirements: [
      {
        test: String,
        bands: String,
      },
    ],
    
    // Analytics
    applicationsCount: { type: Number, default: 0 },
    acceptedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    rejectedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Program", ProgramSchema);
