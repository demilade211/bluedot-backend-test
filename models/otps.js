import mongoose from "mongoose";
import validator from "validator";

const Schema = mongoose.Schema;


const OtpSchema = new Schema({
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,// cant have more than one if this
        validate: [validator.isEmail, 'Please enter valid email address']
    },
    otp:{
        type: String,
        required:true
    },
    expiretoken:{type: Date}
})

module.exports = mongoose.model("otp", OtpSchema)