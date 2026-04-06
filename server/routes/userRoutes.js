const express = require("express");
const { 
  updateProfile, 
  updatePreferences, 
  addToShortlist, 
  removeFromShortlist,
  getAllUsers
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // All routes below require auth

router.put("/profile", updateProfile);
router.put("/preferences", updatePreferences);
router.post("/shortlist", addToShortlist);
router.delete("/shortlist/:shortlistId", removeFromShortlist);

// Admin only routes
router.get("/", authorize("admin"), getAllUsers);

module.exports = router;
