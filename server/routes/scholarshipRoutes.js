const express = require("express");
const { 
  getScholarships, 
  getScholarship, 
  getOrgScholarships,
  createScholarship,
  updateScholarship,
  deleteScholarship
} = require("../controllers/scholarshipController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.route("/")
  .get(getScholarships)
  .post(protect, authorize("scholarship_org", "admin"), createScholarship);

router.route("/org/me")
  .get(protect, authorize("scholarship_org"), getOrgScholarships);

router.route("/:id")
  .get(getScholarship)
  .put(protect, authorize("scholarship_org", "admin"), updateScholarship)
  .delete(protect, authorize("scholarship_org", "admin"), deleteScholarship);

module.exports = router;
