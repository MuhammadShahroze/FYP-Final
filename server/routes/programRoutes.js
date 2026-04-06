const express = require("express");
const { 
  getPrograms, 
  getProgram, 
  getUniversityPrograms,
  createProgram,
  updateProgram,
  deleteProgram
} = require("../controllers/programController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.route("/")
  .get(getPrograms)
  .post(protect, authorize("university", "admin"), createProgram);

router.route("/university/me")
  .get(protect, authorize("university"), getUniversityPrograms);

router.route("/:id")
  .get(getProgram)
  .put(protect, authorize("university", "admin"), updateProgram)
  .delete(protect, authorize("university", "admin"), deleteProgram);

module.exports = router;
