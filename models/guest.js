import mongoose from "mongoose";
import validator from "validator";

const Schema = mongoose.Schema;

const GuestSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      validate: [validator.isEmail, "Please enter a valid email address"],
    },
    firstName: {
      type: String,
      required: [true, "Please enter your first name"],
      maxlength: [30, "First name cannot exceed 30 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Please enter your last name"],
      maxlength: [30, "Last name cannot exceed 30 characters"],
    },
    guest: {
      firstName: {
        type: String,
        maxlength: [30, "Guest's first name cannot exceed 30 characters"],
      },
      lastName: {
        type: String,
        maxlength: [30, "Guest's last name cannot exceed 30 characters"],
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Guest", GuestSchema);
