import express from "express";
import { getProducts, addToCart, updateCartQuantity, removeFromCart, searchProducts, createProduct, createManyProducts, getOneProduct, updateProduct, deleteProduct } from "../controllers/productController.js";
import { allowedRoles, authenticateUser } from "../middlewares/authMiddleware.js";
const router = express.Router()

router.route('/products').get(getProducts);
router.route('/search/:searchText').get(searchProducts);
router.route('/product/:productId').get(getOneProduct);
router.route('/products/cart/:productId').post(authenticateUser, addToCart)
    .delete(authenticateUser, removeFromCart)
    .put(authenticateUser, updateCartQuantity);  
router.route('/admin/product/create').post(authenticateUser, allowedRoles("admin"), createProduct);
router.route('/admin/product/createMany').post(authenticateUser, allowedRoles("admin"), createManyProducts);
router.route('/admin/product/:productId')
    .put(authenticateUser, allowedRoles("admin"), updateProduct)
    .delete(authenticateUser, allowedRoles("admin"), deleteProduct); 
 

export default router;