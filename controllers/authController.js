import UserModel from "../models/user"
import otpModel from "../models/otps"
import QuotationModel from "../models/quotation.js"
import ProductModel from "../models/product.js"
import ErrorHandler from "../utils/errorHandler.js";
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import crypto from "crypto"
import sendEmail from "../utils/sendEmail"
import newOTP from 'otp-generators';
import { v4 as uuidv4 } from "uuid";
import { handleEmail } from "../utils/helpers";

const regexUserName = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/; 

export const sendOtpToEmail = async (req, res, next) => {

    const { email } = req.body;

    const user = await UserModel.findOne({ email: email.toLowerCase() })

    // Generate token
    const otp = newOTP.generate(5, { alphabets: false, upperCase: false, specialChar: false });

    // Hash and set to resetPasswordToken
    const hashed = crypto.createHash('sha256').update(otp).digest('hex');

    // Set token expire time
    const expiryDate = Date.now() + 30 * 60 * 1000

    const message = `Hi there use the otp below to complete your registeration:\n\n${otp}\n\nif you have not 
        requested this email, then ignore it.`

    try {
        let user = await UserModel.findOne({ email: email.toLowerCase() });

        if (user) {
            // Update existing document
            user.otp = hashed;
            user.expiretoken = expiryDate;
            await user.save();
        } else {
            // Create new document
            user = await otpModel.create({
                email: email.toLowerCase(),
                otp: hashed,
                expiretoken: expiryDate
            });
        }

        // Send email with OTP
        await handleEmail(user, next, res, "Spinel Hub OTP", "7b7e9a94-7977-43d4-aace-dc85fe0389ee", { "otp": otp });


        return res.status(200).json({
            success: true,
            message: `Email sent to ${user.email}`
        })
    } catch (error) {
        return next(error);
    }
}

export const verifyOtp = async (req, res, next) => {
    const { otp } = req.body;

    try {
        // Hash URL otp
        const resetOtp = crypto.createHash('sha256').update(otp).digest('hex')

        const user = await otpModel.findOne({
            otp: resetOtp,
            expiretoken: { $gt: Date.now() }
        })

        if (!user) return next(new ErrorHandler('OTP is invalid or has expired', 200))

        return res.status(200).json({
            success: true,
            message: `OTP Verified`,
        })


    } catch (error) {
        return next(error)
    }
}

export const registerUser = async (req, res, next) => {

    try {
        const { name, email, password, confirmPassword } = req.body

        if (!name || !email || !password || !confirmPassword) return next(new ErrorHandler("All fields required", 400))

        if (password !== confirmPassword) return next(new ErrorHandler("Passwords do not match", 200))

        if (password.length < 6) return next(new ErrorHandler("Password cannot be less than 6 characters", 200))

        const user = await UserModel.findOne({ email: email.toLowerCase() })

        if (user) return next(new ErrorHandler("User already registered", 200))

        //const dob = new Date(dateOfBirth)


        const savedUser = await UserModel.create({
            email: email.toLowerCase(),
            name,
            password,
            cartItems: [],
            wishItems: [],
        });



        const payload = { userid: savedUser._id }
        const authToken = await jwt.sign(payload, process.env.SECRETE, { expiresIn: '7d' })//expiresIn: '7d' before

        res.status(200).json({
            success: true,
            token: authToken,
            name: savedUser.name
        })

    } catch (error) {
        return next(error)
    }
}

//To login {{DOMAIN}}/api/login
export const loginUser = async (req, res, next) => {

    const { email, password } = req.body

    try {

        if (!email || !password) return next(new ErrorHandler("All fields required", 400))

        if (password.length < 6) return next(new ErrorHandler("Password cannot be less than 6 characters", 200))


        const user = await UserModel.findOne({ email: email.toLowerCase() }).select("+password")


        if (!user) return next(new ErrorHandler("Invalid Credentials", 200))

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return next(new ErrorHandler("Invalid Credentials", 200))
        }

        const payload = {
            userid: user._id
        }

        const authToken = await jwt.sign(payload, process.env.SECRETE, { expiresIn: '7d' })

        let name = user.name || "No name"

        res.status(200).json({
            success: true,
            token: authToken,
            name
        })

    } catch (error) {
        return next(error)
    }
}

//Forgot password {{DOMAIN}}/api/v1/password/forgot
export const forgotPassword = async (req, res, next) => {

    const { email } = req.body;

    try {

        const user = await UserModel.findOne({ email: email.toLowerCase() })

        if (!user) return next(new ErrorHandler("User with this email not found", 200))

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash and set to resetPasswordToken
        user.resettoken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set token expire time
        user.expiretoken = Date.now() + 30 * 60 * 1000

        await user.save({ validateBeforeSave: false });


        const message = `Your password reset token is as follows:\n\n${resetToken}\n\nif you have not 
        requested this email, then ignore it.`

        try {
            await sendEmail({
                email: user.email,
                subject: "Tuale Password Recovery",
                message
            })

            res.status(200).json({
                success: true,
                message: `Email sent to ${user.email}`
            })
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false })
            return next(new ErrorHandler(error.message, 500))

        }


    } catch (error) {
        return next(error)
    }
}

//reset password {{DOMAIN}}/api/v1/verify/password/:token
export const verifyToken = async (req, res, next) => {
    const { token } = req.body;

    try {
        // Hash URL token
        const resettoken = crypto.createHash('sha256').update(token).digest('hex')

        const user = await UserModel.findOne({
            resettoken,
            expiretoken: { $gt: Date.now() }
        })

        if (!user) return next(new ErrorHandler('Password reset token is invalid or has been expired', 200))

        return res.status(200).json({
            success: true,
            message: `Token Verified`,
            userId: user._id
        })


    } catch (error) {
        return next(error)
    }
}

//reset password {{DOMAIN}}/api/v1/password/reset/:userId
export const resetPassword = async (req, res, next) => {
    const { userId } = req.params;
    const { password, confirmPassword } = req.body;

    try {

        const user = await UserModel.findById(userId)

        if (!user) return next(new ErrorHandler('Pass a valid user Id', 400))

        if (!password || !confirmPassword) return next(new ErrorHandler('All fields required', 400))

        if (password !== confirmPassword) {
            return next(new ErrorHandler('Password does not match', 200))
        }

        // Setup new password

        user.password = password;

        user.resettoken = undefined;
        user.expiretoken = undefined;

        await user.save();

        const payload = { userid: user._id }
        const authToken = await jwt.sign(payload, process.env.SECRETE, { expiresIn: '7d' })

        res.status(200).json({
            success: true,
            token: authToken,
            name: user.name
        })

    } catch (error) {
        return next(error)
    }
}

export const getLoggedInUser = async (req, res, next) => {
    const { _id } = req.user;

    try {
        const user = await UserModel.findById(_id)
            .populate("cartItems.product")
            .populate("wishItems.product")

        const productsCount = await ProductModel.countDocuments()
        const userCount = await UserModel.countDocuments()
        const quotationCount = await QuotationModel.countDocuments()

        return res.status(200).json({
            success: true,
            user,
            productsCount: user.role === "admin" && productsCount,
            userCount: user.role === "admin" && userCount,
            quotationCount: user.role === "admin" && quotationCount

        })

    } catch (error) {
        return next(error)
    }
}

export const updatePassword = async (req, res, next) => {
    const { _id } = req.user;
    const { currentPassword, newPassword } = req.body
    try {

        if (newPassword.length < 6) return next(new ErrorHandler("Password cannot be less than 6 characters", 200))

        const user = await UserModel.findById(_id).select("+password")

        const isPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isPassword) {
            return next(new ErrorHandler("Invalid Old Password", 200))
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password Changed"
        })

    } catch (error) {
        return next(error)
    }
}