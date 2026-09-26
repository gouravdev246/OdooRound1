import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma.js";
import {
  signupSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
} from "./auth.validation.js";

const JWT_SECRET = process.env.JWT_SECRET || "stocksense_jwt_secure_secret_key_2026_x89";
const JWT_EXPIRES_IN = "7d";

const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(", ");
      return res.status(400).json({
        success: false,
        message: errorMsg,
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { name, email, password, role } = parseResult.data;
    const cleanEmail = email.toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash,
        role: role || "WAREHOUSE_STAFF",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id, user.email, user.role);

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to register account.",
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(", ");
      return res.status(400).json({
        success: false,
        message: errorMsg,
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parseResult.data;
    const cleanEmail = email.toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive. Please contact your system administrator.",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user.id, user.email, user.role);

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: userProfile,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to log in.",
    });
  }
};

// GET /api/auth/me (Get profile of current logged-in user)
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user profile.",
    });
  }
};

// POST /api/auth/forgot-password (Generate OTP)
export const forgotPassword = async (req, res) => {
  try {
    const parseResult = resetPasswordRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors.map(e => e.message).join(", "),
      });
    }

    const { email } = parseResult.data;
    const cleanEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      // Return 200 to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, an OTP has been dispatched.",
      });
    }

    // Generate 6 digit OTP valid for 15 minutes
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpiresAt: expiresAt,
      },
    });

    console.log(`[AUTH] Password reset OTP for ${cleanEmail}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, an OTP has been dispatched.",
      // Provide OTP in dev mode for testing convenience
      ...(process.env.NODE_ENV !== "production" && { devOtp: otp }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process forgot password request.",
    });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors.map(e => e.message).join(", "),
      });
    }

    const { email, otp, newPassword } = parseResult.data;
    const cleanEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user || !user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP code.",
      });
    }

    if (user.resetOtpExpiresAt && new Date() > new Date(user.resetOtpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetOtp: null,
        resetOtpExpiresAt: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password.",
    });
  }
};
