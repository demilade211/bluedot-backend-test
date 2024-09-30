import mongoose from "mongoose";
import validator from "validator";

const { Schema } = mongoose;

const QuotationSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, "Please enter your name"],
        maxlength: [30, "Your name cannot exceed 30 characters"]
    },
    country: {
        type: String,
        required: [true, "Please enter your country"]
    },
    state: {
        type: String,
        required: [true, "Please enter your state"]
    },
    city: {
        type: String,
        required: [true, "Please enter your city"]
    },
    zipCode: {
        type: String,
        required: [true, "Please enter your zip code"]
    },
    phone: {
        type: String,
        required: [true, "Please enter your phone number"]
    },
    streetAdress: {
        type: String,
        required: [true, "Please enter your street address"]
    }, 
}, { timestamps: true });

export default mongoose.model("Quotation", QuotationSchema);
