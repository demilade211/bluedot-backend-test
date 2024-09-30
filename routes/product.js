import express from "express";
import { getProducts, addToCart, updateCartQuantity,sendQuotationToEmail, addToWishlist, removeFromWishlist, removeFromCart, searchProducts, createProduct, createManyProducts, getOneProduct, updateProduct, deleteProduct, createProductReview, getProductReviews, deleteReview } from "../controllers/productController.js";
import { allowedRoles, authenticateUser } from "../middlewares/authMiddleware.js";
const router = express.Router()

router.route('/products').get(getProducts);
router.route('/search/:searchText').get(searchProducts);
router.route('/product/:productId').get(getOneProduct);
router.route('/products/cart/:productId').post(authenticateUser, addToCart)
    .delete(authenticateUser, removeFromCart)
    .put(authenticateUser, updateCartQuantity);
router.route('/products/wishList/:productId').post(authenticateUser, addToWishlist)
    .delete(authenticateUser, removeFromWishlist);
router.route('/admin/product/create').post(authenticateUser, allowedRoles("admin"), createProduct);
router.route('/admin/product/createMany').post(authenticateUser, allowedRoles("admin"), createManyProducts);
router.route('/admin/product/:productId')
    .put(authenticateUser, allowedRoles("admin"), updateProduct)
    .delete(authenticateUser, allowedRoles("admin"), deleteProduct);
router.route('/products/quotation').post(authenticateUser, sendQuotationToEmail)

router.route('/review').put(authenticateUser, createProductReview)
router.route('/reviews').get(authenticateUser, getProductReviews)
router.route('/reviews').delete(authenticateUser, deleteReview)

export default router;