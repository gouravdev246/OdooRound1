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

router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.get("/auth/me", authenticateToken, getMe);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);

export default router;
