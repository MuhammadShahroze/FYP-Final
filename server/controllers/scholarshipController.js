const Scholarship = require("../models/Scholarship");
const User = require("../models/User");
const Notification = require("../models/Notification");

// @desc    Get all scholarships (with query filtering)
// @route   GET /api/scholarships
// @access  Public
exports.getScholarships = async (req, res) => {
  try {
    const { search, country, degreeLevel, subject, type } = req.query;
    
    let query = { status: "active" };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { organization: { $regex: search, $options: "i" } }
      ];
    }
    
    if (country && country !== "All Countries") query.country = country;
    if (degreeLevel && degreeLevel !== "All Levels") query.degreeLevel = degreeLevel;
    if (subject && subject !== "All Subjects") query.subjectGroups = { $in: [subject] };
    if (type && type !== "All Types") query.type = type;

    const scholarships = await Scholarship.find(query).sort("-createdAt");
    
    res.status(200).json({ success: true, count: scholarships.length, data: scholarships });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get single scholarship
// @route   GET /api/scholarships/:id
// @access  Public
exports.getScholarship = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, error: "Scholarship not found" });
    }
    res.status(200).json({ success: true, data: scholarship });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get scholarships for a specific org
// @route   GET /api/scholarships/org/me
// @access  Private (org)
exports.getOrgScholarships = async (req, res) => {
  try {
    const scholarships = await Scholarship.find({ ownerId: req.user.id });
    res.status(200).json({ success: true, data: scholarships });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Create new scholarship
// @route   POST /api/scholarships
// @access  Private (org)
exports.createScholarship = async (req, res) => {
  try {
    req.body.ownerId = req.user.id;
    req.body.organization = req.user.institutionName || req.user.name;
    req.body.status = "active"; // Ensure it's visible to students immediately

    // Ensure data matches model requirements
    if (req.body.courseType && !req.body.degreeLevel) {
      const degreeMap = {
        'bachelors': "Bachelor's",
        'masters': "Master's",
        'phd': "PhD"
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

    const scholarship = await Scholarship.create(req.body);

    // Notify all students about the new scholarship
    const students = await User.find({ role: "student" });
    if (students.length > 0) {
      const notifications = students.map(student => ({
        recipient: student._id,
        title: "New Scholarship Opportunity!",
        message: `${scholarship.organization} has announced a new scholarship: ${scholarship.title}. Start your application today!`,
        type: "scholarship",
        relatedId: scholarship._id
      }));
      await Notification.insertMany(notifications, { ordered: false }).catch(err => {
        console.error("Failed to insert notifications:", err.message);
      });
    }

    res.status(201).json({ success: true, data: scholarship });
  } catch (error) {
    console.error("Create Scholarship Error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update scholarship
// @route   PUT /api/scholarships/:id
// @access  Private (org)
exports.updateScholarship = async (req, res) => {
  try {
    let scholarship = await Scholarship.findById(req.params.id);

    if (!scholarship) {
      return res.status(404).json({ success: false, error: "Scholarship not found" });
    }

    if (scholarship.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ success: false, error: "Not authorized to update this scholarship" });
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
      req.body.contactEmail = normalizedContactEmail || scholarship.contactEmail || req.user.email || "";
    }

    scholarship = await Scholarship.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: scholarship });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete scholarship
// @route   DELETE /api/scholarships/:id
// @access  Private (org)
exports.deleteScholarship = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);

    if (!scholarship) {
      return res.status(404).json({ success: false, error: "Scholarship not found" });
    }

    if (scholarship.ownerId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ success: false, error: "Not authorized to delete this scholarship" });
    }

    await scholarship.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
