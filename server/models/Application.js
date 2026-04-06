const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["program", "scholarship"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    targetOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Cached snapshot data to avoid excessive populated queries
    studentName: { type: String },
    studentEmail: { type: String },
    studentCgpa: { type: String },
    targetTitle: { type: String },
    targetOwnerName: { type: String },
    
    status: {
      type: String,
      enum: ["draft", "pending", "under_review", "accepted", "rejected", "documents_requested"],
      default: "pending",
    },
    
    documents: [
      {
        name: String,
        url: String, // URL or encoded file data
        fileName: String,
        mimeType: String,
        fileSize: Number,
      },
    ],
    
    appliedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", ApplicationSchema);
