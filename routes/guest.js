import express from "express";
import { addGuest,getAllGuests } from "../controllers/guestController.js";
import { allowedRoles, authenticateUser } from "../middlewares/authMiddleware.js";
const router = express.Router()

router.route('/').post(addGuest).get(getAllGuests) 
 

export default router;