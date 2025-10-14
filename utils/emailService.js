const nodemailer = require("nodemailer");

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send verification email
const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Astral Credit Union - Email Verification",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1E5BA8, #163f75); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Astral Credit Union</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Email Verification</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
          <p style="color: #666; margin-bottom: 25px;">Thank you for signing up with Astral Credit Union. Please use the verification code below to complete your registration:</p>
          
          <div style="background: white; border: 2px solid #1E5BA8; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <h1 style="color: #1E5BA8; font-size: 36px; margin: 0; letter-spacing: 5px; font-family: monospace;">${code}</h1>
          </div>
          
          <p style="color: #666; margin-bottom: 20px;">This code will expire in 10 minutes for security purposes.</p>
          <p style="color: #666; margin-bottom: 0;">If you didn't create an account with us, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message from Astral Credit Union. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
};

module.exports = { sendVerificationEmail };
