const Application = require("../models/Application");
const Program = require("../models/Program");
const Scholarship = require("../models/Scholarship");

const attachTargetDetails = async (application) => {
  const app = application.toObject ? application.toObject() : { ...application };

  if (app.targetType === "program") {
    const program = await Program.findById(app.targetId).select("title university ownerId");
    app.program = program
      ? {
          _id: program._id,
          title: program.title,
          ownerName: program.university,
          ownerId: program.ownerId,
        }
      : {
          _id: app.targetId,
          title: app.targetTitle,
          ownerName: app.targetOwnerName,
        };
  }

  if (app.targetType === "scholarship") {
    const scholarship = await Scholarship.findById(app.targetId).select("title organization ownerId");
    app.scholarship = scholarship
      ? {
          _id: scholarship._id,
          title: scholarship.title,
          ownerName: scholarship.organization,
          ownerId: scholarship.ownerId,
        }
      : {
          _id: app.targetId,
          title: app.targetTitle,
          ownerName: app.targetOwnerName,
        };
  }

  return app;
};

// @desc    Get all applications for current student
// @route   GET /api/applications/me
// @access  Private (Student)
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ studentId: req.user.id }).sort("-createdAt");
    const hydratedApplications = await Promise.all(applications.map(attachTargetDetails));
    res.status(200).json({ success: true, data: hydratedApplications });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all applications sent to current institution
// @route   GET /api/applications/institution
// @access  Private (University / Scholarship Org)
exports.getInstitutionApplications = async (req, res) => {
  try {
    const applications = await Application.find({ targetOwnerId: req.user.id }).sort("-createdAt");
    const hydratedApplications = await Promise.all(applications.map(attachTargetDetails));
    res.status(200).json({ success: true, data: hydratedApplications });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private (Owner or Target Institution)
exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    // Check ownership
    const isOwner = application.studentId.toString() === req.user.id;
    const isTarget = application.targetOwnerId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isTarget && !isAdmin) {
      return res.status(401).json({ success: false, error: "Not authorized to access this application" });
    }

    const hydratedApplication = await attachTargetDetails(application);
    res.status(200).json({ success: true, data: hydratedApplication });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Create new application
// @route   POST /api/applications
// @access  Private (Student)
exports.createApplication = async (req, res) => {
  try {
    // Expects targetId, targetType ('program' or 'scholarship'), documents array
    const { targetId, targetType, documents } = req.body;

    // Validate target exists and get targetOwnerId and title
    let target;
    if (targetType === "program") {
      target = await Program.findById(targetId);
    } else if (targetType === "scholarship") {
      target = await Scholarship.findById(targetId);
    }

    if (!target) {
      return res.status(404).json({ success: false, error: "Target not found" });
    }

    const requiredDocuments = Array.isArray(target.requiredDocuments)
      ? target.requiredDocuments.map((doc) => `${doc || ""}`.trim()).filter(Boolean)
      : [];
    const normalizedDocuments = Array.isArray(documents)
      ? documents
          .map((doc) => ({
            name: `${doc?.name || ""}`.trim(),
            url: `${doc?.url || ""}`.trim(),
            fileName: `${doc?.fileName || ""}`.trim(),
            mimeType: `${doc?.mimeType || ""}`.trim(),
            fileSize: Number(doc?.fileSize || 0),
          }))
          .filter((doc) => doc.name && doc.url)
      : [];

    if (requiredDocuments.length > 0) {
      const submittedNames = new Set(normalizedDocuments.map((doc) => doc.name.toLowerCase()));
      const missing = requiredDocuments.filter((name) => !submittedNames.has(name.toLowerCase()));
      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required documents: ${missing.join(", ")}`,
        });
      }
    }

    // Check if user already applied
    const existing = await Application.findOne({
      studentId: req.user.id,
      targetId: targetId,
    });

    if (existing) {
      return res.status(400).json({ success: false, error: "You have already applied to this program/scholarship" });
    }

    let cgpa = undefined;
    if (req.user.academicInfo && req.user.academicInfo.length > 0) {
      cgpa = req.user.academicInfo[0].cgpa;
    }

    const application = await Application.create({
      studentId: req.user.id,
      targetType,
      targetId,
      targetOwnerId: target.ownerId,
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentCgpa: cgpa,
      targetTitle: target.title,
      targetOwnerName: target.university || target.organization || "",
      documents: normalizedDocuments,
    });

    // Update analytics counters
    target.applicationsCount += 1;
    target.pendingCount += 1;
    await target.save();

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    console.error("Create Application Error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (University / Scholarship Org)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    if (application.targetOwnerId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ success: false, error: "Not authorized to update this application" });
    }

    const oldStatus = application.status;
    application.status = status;
    await application.save();

    // Adjust analytics if moving from pending -> accepted/rejected
    let target;
    if (application.targetType === "program") target = await Program.findById(application.targetId);
    else target = await Scholarship.findById(application.targetId);

    if (target) {
      if (oldStatus === "pending") target.pendingCount = Math.max(0, target.pendingCount - 1);
      if (oldStatus === "accepted") target.acceptedCount = Math.max(0, target.acceptedCount - 1);
      if (oldStatus === "rejected") target.rejectedCount = Math.max(0, target.rejectedCount - 1);

      if (status === "pending") target.pendingCount += 1;
      if (status === "accepted") target.acceptedCount += 1;
      if (status === "rejected") target.rejectedCount += 1;
      await target.save();
    }

    res.status(200).json({ success: true, data: application });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
