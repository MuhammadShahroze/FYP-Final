const express = require("express");
const Program = require("../models/Program");
const Scholarship = require("../models/Scholarship");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Matching Engine Logic
router.get("/recommendations", protect, authorize("student", "admin"), async (req, res) => {
  try {
    const user = req.user;
    
    // Default criteria
    let cgpa = 0;
    if (user.academicInfo && user.academicInfo.length > 0) {
      cgpa = parseFloat(user.academicInfo[0].cgpa) || 0;
    }
    
    const preferredSubjects = user.preferences?.subjects || [];
    const preferredDegrees = user.preferences?.degreeLevels || [];
    
    // Build Program Query
    let progQuery = { status: "active" };
    
    // Strict match on cgpa requirement being lower than or equal to user's CGPA
    if (cgpa > 0) progQuery.cgpaRequirement = { $lte: cgpa };
    
    // For subject and degrees, if the preferences aren't "All", we filter IN
    if (preferredSubjects.length > 0 && !preferredSubjects.includes("All Subjects")) {
      progQuery.subjectGroups = { $in: preferredSubjects };
    }
    
    const recommendedPrograms = await Program.find(progQuery).limit(3);
    
    // Build Scholarship Query
    let scholQuery = { status: "active" };
    if (cgpa > 0) scholQuery.cgpaRequirement = { $lte: cgpa };
    if (preferredSubjects.length > 0 && !preferredSubjects.includes("All Subjects")) {
      scholQuery.subjectGroups = { $in: preferredSubjects };
    }

    const recommendedScholarships = await Scholarship.find(scholQuery).limit(3);
    
    res.status(200).json({
      success: true,
      data: {
        programs: recommendedPrograms,
        scholarships: recommendedScholarships
      }
    });

  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
