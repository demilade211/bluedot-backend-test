import express from "express";
import { getCategories, addCategory, addSubcategory } from "../controllers/categoryController.js";
import { allowedRoles, authenticateUser } from "../middlewares/authMiddleware.js";
const router = express.Router()

router.route('/category').post(authenticateUser, addCategory)
    .get(getCategories)

router.route('/:categoryId/subcategories').post(authenticateUser, addSubcategory) 

export default router;