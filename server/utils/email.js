const nodemailer = require("nodemailer");

const createTransport = () => {
  const emailUser = process.env.GMAIL_USER;
  const emailPass = process.env.GMAIL_APP_PASSWORD;

  if (!emailUser || !emailPass) {
    throw new Error("Email service is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

exports.sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const transporter = createTransport();
  const fromName = process.env.EMAIL_FROM_NAME || "EduDuctor";
  const fromAddress = process.env.GMAIL_USER;

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject: "Reset your EduDuctor password",
    text: [
      `Hello ${name || "there"},`,
      "",
      "We received a request to reset your EduDuctor password.",
      `Use this link to reset it: ${resetUrl}`,
      "",
      "This link will expire in 1 hour.",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 8px;">Reset your password</h2>
        <p>Hello ${name || "there"},</p>
        <p>We received a request to reset your EduDuctor password.</p>
        <p>
          <a
            href="${resetUrl}"
            style="display: inline-block; padding: 12px 20px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;"
          >
            Reset Password
          </a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
};
