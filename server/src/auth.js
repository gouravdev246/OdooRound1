import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "./db.js";

const router = express.Router();


// =========================
// SIGN UP
// =========================
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash
            }
        });

        return res.status(201).json({
            message: "User created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Signup failed"
        });
    }
});


// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "Account is inactive"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Login failed"
        });
    }
});


// =========================
// FORGOT PASSWORD
// =========================
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const otpHash = await bcrypt.hash(otp, 10);

        const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetOtp: otpHash,
                resetOtpExpiresAt: expiresAt
            }
        });

        // Temporary for development/testing.
        // Later this OTP should be sent through email.
        console.log(`OTP for ${email}: ${otp}`);

        return res.json({
            message: "OTP generated successfully"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Could not generate OTP"
        });
    }
});


// =========================
// RESET PASSWORD
// =========================
router.post("/reset-password", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: "Email, OTP and new password are required"
            });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.resetOtp || !user.resetOtpExpiresAt) {
            return res.status(400).json({
                message: "Invalid or expired OTP"
            });
        }

        if (new Date() > user.resetOtpExpiresAt) {
            return res.status(400).json({
                message: "OTP has expired"
            });
        }

        const otpMatch = await bcrypt.compare(
            otp,
            user.resetOtp
        );

        if (!otpMatch) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetOtp: null,
                resetOtpExpiresAt: null
            }
        });

        return res.json({
            message: "Password reset successfully"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Password reset failed"
        });
    }
});


export default router;