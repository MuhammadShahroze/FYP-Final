const express = require("express");
const { 
  getMyApplications,
  getInstitutionApplications,
  getApplication,
  createApplication,
  updateApplicationStatus
} = require("../controllers/applicationController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // All routes below require auth

router.route("/me")
  .get(authorize("student", "admin"), getMyApplications);

router.route("/institution")
  .get(authorize("university", "scholarship_org", "admin"), getInstitutionApplications);

router.route("/")
  .post(authorize("student", "admin"), createApplication);

router.route("/:id")
  .get(getApplication);

router.route("/:id/status")
  .put(authorize("university", "scholarship_org", "admin"), updateApplicationStatus);

module.exports = router;
