const User = require("../models/User");

const normalizeShortlistType = (itemType) => {
  const normalized = (itemType || "").toString().toLowerCase();
  if (normalized !== "program" && normalized !== "scholarship") {
    return null;
  }

  return {
    itemType: normalized,
    itemModel: normalized === "program" ? "Program" : "Scholarship",
  };
};

const ensureShortlistConsistency = async (user) => {
  if (!user || !Array.isArray(user.shortlist)) return user;

  let changed = false;

  user.shortlist.forEach((entry) => {
    const normalized = normalizeShortlistType(entry.itemType || entry.itemModel);
    if (!normalized) return;

    if (entry.itemType !== normalized.itemType) {
      entry.itemType = normalized.itemType;
      changed = true;
    }

    if (entry.itemModel !== normalized.itemModel) {
      entry.itemModel = normalized.itemModel;
      changed = true;
    }
  });

  if (changed) {
    await user.save();
  }

  return user;
};

const getPopulatedUser = async (userId) => {
  let user = await User.findById(userId);
  if (!user) return null;

  await ensureShortlistConsistency(user);

  return User.findById(userId).select("-password").populate("shortlist.itemId");
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    const populatedUser = await getPopulatedUser(user._id);

    res.status(200).json({ success: true, data: populatedUser });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    user.preferences = req.body;
    
    // Update profile completion if necessary
    if (user.role === "student" && user.profileCompletion < 50) {
      user.profileCompletion = 50; 
    }

    await user.save();
    
    // Refresh to get populated data
    const updatedUser = await getPopulatedUser(req.user.id);

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.addToShortlist = async (req, res) => {
  try {
    const { itemId, itemType } = req.body;
    
    if (!itemId || !itemType) {
      return res.status(400).json({ success: false, error: "itemId and itemType are required" });
    }

    const normalized = normalizeShortlistType(itemType);
    if (!normalized) {
      return res.status(400).json({ success: false, error: "itemType must be program or scholarship" });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    await ensureShortlistConsistency(user);

    // Check if already in shortlist - handle both populated and non-populated itemId
    const exists = user.shortlist.find(item => {
      if (!item.itemId) return false;
      const id = item.itemId._id ? item.itemId._id.toString() : item.itemId.toString();
      return id === itemId;
    });

    if (exists) {
      // Gracefully return success as the user probably just clicked twice
      const updatedUser = await getPopulatedUser(req.user.id);
      return res.status(200).json({ success: true, data: updatedUser });
    }

    user.shortlist.push({ ...normalized, itemId });
    await user.save();
    
    const updatedUser = await getPopulatedUser(req.user.id);

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Add to Shortlist Error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.removeFromShortlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    await ensureShortlistConsistency(user);
    
    const targetId = req.params.shortlistId; // The program/scholarship ID or entry ID

    user.shortlist = user.shortlist.filter(item => {
      if (!item.itemId) return true; // Keep anyway if null
      
      const itemEntryId = item._id.toString();
      const itemId = item.itemId._id ? item.itemId._id.toString() : item.itemId.toString();
      
      return itemEntryId !== targetId && itemId !== targetId;
    });
    
    await user.save();
    
    const updatedUser = await getPopulatedUser(req.user.id);

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Remove from Shortlist Error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Admin route
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
