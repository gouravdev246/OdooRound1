import { Router } from "express";
import { getAllProducts, createProduct } from "./product.controller.js";

const router = Router();

router.get("/products", getAllProducts);
router.post("/products", createProduct);

export default router;
