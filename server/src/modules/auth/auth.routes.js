import { Router } from "express";
import {
  signup,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} from "./auth.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const router = Router();

// Auth routes (supporting both /api/auth/login and /api/login)
router.post("/auth/signup", signup);
router.post("/signup", signup);

router.post("/auth/login", login);
router.post("/login", login);

router.get("/auth/me", authenticateToken, getMe);
router.get("/me", authenticateToken, getMe);

router.post("/auth/forgot-password", forgotPassword);
router.post("/forgot-password", forgotPassword);

router.post("/auth/reset-password", resetPassword);
router.post("/reset-password", resetPassword);

export default router;
