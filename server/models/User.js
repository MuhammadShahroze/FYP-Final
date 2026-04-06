const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "university", "scholarship_org", "admin"],
      required: true,
    },
    verified: { type: Boolean, default: false },
    avatar: { type: String },

    // Student-specific fields
    studentTier: {
      type: String,
      enum: ["guest", "registered", "pro"],
      default: "guest",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "inactive",
    },
    profileCompletion: { type: Number, default: 25 },
    nationality: { type: String },
    dateOfBirth: { type: Date },
    phone: { type: String },
    
    academicInfo: [
      {
        degree: String,
        field: String,
        institution: String,
        cgpa: String,
        graduationYear: String,
        subjects: String,
        transcript: String,
      },
    ],
    
    preferences: {
      countries: [String],
      subjects: [String],
      degreeLevels: [String],
    },

    documents: [
      {
        name: String,
        type: { type: String }, // e.g. "resume", "transcript", "passport"
        url: String,
        uploadedAt: { type: Date, default: Date.now },
        size: String,
      },
    ],
    
    shortlist: [
      {
        itemType: { type: String, enum: ["program", "scholarship"] },
        itemModel: { type: String, enum: ["Program", "Scholarship"] },
        itemId: { type: mongoose.Schema.Types.ObjectId, refPath: "shortlist.itemModel" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    
    // Institution-specific fields
    institutionName: { type: String }, // Populated if role is university or scholarship_org
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// Password hashing middleware
UserSchema.pre("save", async function () {
  if (Array.isArray(this.shortlist)) {
    this.shortlist.forEach((entry) => {
      const rawType = (entry.itemType || "").toString().toLowerCase();
      if (rawType === "program" || rawType === "scholarship") {
        entry.itemType = rawType;
        entry.itemModel = rawType === "program" ? "Program" : "Scholarship";
      }
    });
  }

  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password helper
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
