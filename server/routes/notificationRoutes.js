const express = require("express");
const router = express.Router();
const { getNotifications, markAsRead, deleteNotification } = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.route("/")
  .get(protect, getNotifications);

router.route("/:id")
  .delete(protect, deleteNotification);

router.put("/:id/read", protect, markAsRead);

module.exports = router;
