const Program = require("../models/Program");
const User = require("../models/User");
const Notification = require("../models/Notification");

// @desc    Get all programs (with query filtering)
// @route   GET /api/programs
// @access  Public
exports.getPrograms = async (req, res) => {
  try {
    const { search, country, degreeLevel, subject } = req.query;
    
    let query = { status: "active" };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { university: { $regex: search, $options: "i" } }
      ];
    }
    
    if (country && country !== "All Countries") query.country = country;
    if (degreeLevel && degreeLevel !== "All Levels") query.degreeLevel = degreeLevel;
    if (subject && subject !== "All Subjects") query.subjectGroups = { $in: [subject] };

    const programs = await Program.find(query).sort("-createdAt");
    
    res.status(200).json({ success: true, count: programs.length, data: programs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get single program
// @route   GET /api/programs/:id
// @access  Public
exports.getProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, error: "Program not found" });
    }
    res.status(200).json({ success: true, data: program });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get programs for a specific university
// @route   GET /api/programs/university/:ownerId
// @access  Private
exports.getUniversityPrograms = async (req, res) => {
  try {
    // Only fetch programs owned by this user
    const programs = await Program.find({ ownerId: req.user.id });
    res.status(200).json({ success: true, data: programs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Create new program
// @route   POST /api/programs
// @access  Private (University)
exports.createProgram = async (req, res) => {
  try {
    req.body.ownerId = req.user.id;
    req.body.university = req.user.institutionName || req.user.name;
    req.body.status = "active"; // Ensure it's visible to students immediately

    // Keep legacy and current fee fields in sync.
    if (req.body.semesterFee && !req.body.tuitionFee) {
      req.body.tuitionFee = req.body.semesterFee;
    } else if (req.body.tuitionFee && !req.body.semesterFee) {
      req.body.semesterFee = req.body.tuitionFee;
    }
    
    // Ensure data matches model requirements
    if (req.body.courseType && !req.body.degreeLevel) {
      const degreeMap = {
        'bachelors': "Bachelor's",
        'masters': "Master's",
        'phd': "PhD",
        'prep': "Prep course",
        'language': "Language course",
        'short': "Short course"
      };
      req.body.degreeLevel = degreeMap[req.body.courseType] || req.body.courseType;
    }
    
    // Ensure subjectGroups is an array
    if (typeof req.body.subjectGroups === "string") {
      req.body.subjectGroups = req.body.subjectGroups.split(",").map(sg => sg.trim()).filter(sg => sg !== "");
    }
    if (Array.isArray(req.body.requiredDocuments)) {
      req.body.requiredDocuments = req.body.requiredDocuments
        .flatMap((doc) => `${doc || ""}`.split(","))
        .map((doc) => doc.trim())
        .filter((doc) => doc !== "");
    }
    req.body.country = `${req.body.country || ""}`.trim();
    if (!req.body.country) {
      return res.status(400).json({ success: false, error: "Country is required" });
    }
    req.body.contactEmail = `${req.body.contactEmail || req.user.email || ""}`.trim();
    if (!req.body.contactEmail) {
      return res.status(400).json({ success: false, error: "Contact email is required" });
    }

    const program = await Program.create(req.body);

    // Notify all students about the new program
    const students = await User.find({ role: "student" });
    if (students.length > 0) {
      const notifications = students.map(student => ({
        recipient: student._id,
        title: "New Program Added!",
        message: `${program.university} just posted a new program: ${program.title}. Check it out now!`,
        type: "admission",
        relatedId: program._id
      }));
      await Notification.insertMany(notifications, { ordered: false }).catch(err => {
        console.error("Failed to insert notifications:", err.message);
      });
    }

    res.status(201).json({ success: true, data: program });
  } catch (error) {
    console.error("Create Program Error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update program
// @route   PUT /api/programs/:id
// @access  Private (University)
exports.updateProgram = async (req, res) => {
  try {
    let program = await Program.findById(req.params.id);

    if (!program) {
      return res.status(404).json({ success: false, error: "Program not found" });
    }

    // Make sure user is program owner
    if (program.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ success: false, error: "Not authorized to update this program" });
    }

    // Keep legacy and current fee fields in sync.
    if (req.body.semesterFee && !req.body.tuitionFee) {
      req.body.tuitionFee = req.body.semesterFee;
    } else if (req.body.tuitionFee && !req.body.semesterFee) {
      req.body.semesterFee = req.body.tuitionFee;
    }
    if (Array.isArray(req.body.requiredDocuments)) {
      req.body.requiredDocuments = req.body.requiredDocuments
        .flatMap((doc) => `${doc || ""}`.split(","))
        .map((doc) => doc.trim())
        .filter((doc) => doc !== "");
    }
    if (req.body.country !== undefined) {
      req.body.country = `${req.body.country || ""}`.trim();
    }
    if (req.body.contactEmail !== undefined) {
      const normalizedContactEmail = `${req.body.contactEmail || ""}`.trim();
      req.body.contactEmail = normalizedContactEmail || program.contactEmail || req.user.email || "";
    }

    program = await Program.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: program });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete program
// @route   DELETE /api/programs/:id
// @access  Private (University)
exports.deleteProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);

    if (!program) {
      return res.status(404).json({ success: false, error: "Program not found" });
    }

    if (program.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ success: false, error: "Not authorized to delete this program" });
    }

    await program.deleteOne();
    
    // Note: In real app, we should also delete or cascade applications for this program

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
