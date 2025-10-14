// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate unique routing number (account number)
const generateRoutingNumber = () => {
  // Format: AST-XXXX-XXXX-XXXX (Astral Credit Union format)
  const part1 = Math.floor(1000 + Math.random() * 9000); // 4 digits
  const part2 = Math.floor(1000 + Math.random() * 9000); // 4 digits
  const part3 = Math.floor(1000 + Math.random() * 9000); // 4 digits
  return `AST-${part1}-${part2}-${part3}`;
};

// Temporary storage for unverified users (in production, use Redis or similar)
const pendingUsers = new Map();

// Clean up expired pending users every 5 minutes
const cleanupExpiredUsers = () => {
  setInterval(() => {
    const now = new Date();
    for (const [email, userData] of pendingUsers.entries()) {
      if (now > userData.verificationCodeExpires) {
        pendingUsers.delete(email);
        console.log(`🧹 Removed expired pending user: ${email}`);
      }
    }
  }, 5 * 60 * 1000); // 5 minutes
};

module.exports = {
  generateVerificationCode,
  generateRoutingNumber,
  pendingUsers,
  cleanupExpiredUsers,
};
