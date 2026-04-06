const User = require("../models/User");
const { generateToken } = require("../middleware/auth");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../utils/email");

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

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, institution, nationality, dateOfBirth } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    const userData = {
      name,
      email,
      password,
      role,
      nationality,
      dateOfBirth,
      avatar: name ? name.charAt(0).toUpperCase() : undefined,
    };

    if (role === "student") {
      userData.studentTier = "registered";
      userData.profileCompletion = 25;
    } else {
      userData.profileCompletion = 50;
      userData.institutionName = institution; // Store directly for non-students
    }

    const user = await User.create(userData);
    const token = generateToken(user._id);

    // Filter password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Please provide an email and password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    await ensureShortlistConsistency(user);

    const populatedUser = await User.findById(req.user.id)
      .select("-password")
      .populate("shortlist.itemId");

    res.status(200).json({
      success: true,
      data: populatedUser,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Avoid leaking whether an email exists.
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a reset link has been generated.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, error: "Token and new password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters long" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: "Reset link is invalid or has expired" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
