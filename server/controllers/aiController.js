const User = require("../models/User");
const Program = require("../models/Program");
const Scholarship = require("../models/Scholarship");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const fetchImpl = async (...args) => {
  if (typeof fetch !== "undefined") return fetch(...args);
  throw new Error(
    "Global fetch is not available. Please run the server on Node.js 18+ (recommended) so Gemini proxy can work without exposing API keys."
  );
};

// @desc    Get AI Guidance based on user profile
// @route   POST /api/ai/chat
// @access  Private (Pro Student)
exports.getAIGuidance = async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || user.studentTier !== "pro") {
      return res.status(403).json({ success: false, message: "AI Guidance is a Pro feature." });
    }

    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY in environment variables");
      return res.status(500).json({ success: false, message: "AI configuration is incomplete." });
    }

    // Prepare context from user profile
    const profileContext = `
      User Name: ${user.name}
      Current Level: ${user.academicInfo?.[0]?.degree || "N/A"}
      Field: ${user.academicInfo?.[0]?.field || "N/A"}
      CGPA: ${user.academicInfo?.[0]?.cgpa || "N/A"}
      Preferences: ${user.preferences?.countries?.join(", ") || "Anywhere"}, ${user.preferences?.subjects?.join(", ") || "Any subject"}
    `;

    // Optionally fetch some relevant programs/scholarships to "look up"
    const programs = await Program.find({ status: "active" }).limit(5);
    const scholarships = await Scholarship.find({ status: "active" }).limit(5);

    const systemPrompt = `
      You are the Global Study Navigator AI assistant. 
      Your goal is to help students find the best universities and scholarships based on their profile.
      
      User Profile:
      ${profileContext}
      
      Sample Available Programs:
      ${programs.map(p => `- ${p.title} at ${p.university} (${p.country})`).join("\n")}
      
      Sample Available Scholarships:
      ${scholarships.map(s => `- ${s.title} (${s.type})`).join("\n")}
      
      Instructions:
      1. Be professional, encouraging, and highly specific.
      2. Use the user's profile to tailor your advice.
      3. If they ask about programs, refer to the samples or general knowledge about study destinations.
      4. Keep responses concise and formatted with markdown.
    `;

    const normalizedHistory = Array.isArray(chatHistory) ? chatHistory : [];
    const geminiContents = [
      // Provide system prompt as the first "user" content to keep compatibility with older API behaviors.
      // (Gemini also supports systemInstruction, but this approach is robust across versions.)
      { role: "user", parts: [{ text: systemPrompt }] },
      ...normalizedHistory
        .filter((m) => m && typeof m.content === "string")
        .slice(-6)
        .map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })),
      { role: "user", parts: [{ text: message }] },
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.6,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const status = response.status || 500;
      const errMsg = data?.error?.message || "Gemini API request failed";
      if (status === 429) {
        return res.status(429).json({
          success: false,
          message: "The AI is currently busy (Rate Limited). Please wait a few seconds and try again.",
        });
      }
      console.error("Gemini AI error:", { status, errMsg, data });
      return res.status(500).json({ success: false, message: "I'm having trouble thinking right now. Please try again later." });
    }

    const aiMessage =
      data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("\n").trim() ||
      "Sorry, I couldn't generate a response.";

    return res.status(200).json({ success: true, message: aiMessage });
  } catch (error) {
    console.error("AI Chat Error Details:", {
      message: error.message,
      stack: error.stack,
      status: error.status,
      response: error.response?.data,
    });
    res.status(500).json({ success: false, message: "I'm having trouble thinking right now. Please try again later." });
  }
};
