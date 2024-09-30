import mongoose from "mongoose";

const Schema = mongoose.Schema;
const ProductSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,//gets the  _id from user model
        ref: "User",
        required: true
    },
    name:{
        type: String,
        required: [true, "Please enter product name"],
        trim: true,
        maxlength: [100, "Product name cannot exceed 100 characters"]

    },
    price:{
        type: Number,
        required: [true, "Please enter product price"],
        maxlength: [5, "Product name cannot exceed 5 characters"],
        default: 0.0

    },
    description:{
        type: String,
        required: [true, "Please enter product description"],

    },
    ratings:{
        type: Number,
        default: 0
    },
    images:[ {
        public_id:{
            type: String,
            required: true
        },
        url:{
            type: String,
            required: true
        }
    }],
    category:{
        type: String,
        required: [true, "Please enter category for the product"], 
    },
    subCategory:{
        type: String,  
    },
    seller: {
        type: String
        // type: Schema.Types.ObjectId,//gets the  _id from user model
        // ref: "Store",
    },
    stock:{
        type: Number,
        required: [true, "Please enter product stock"],
        maxlength: [5, "It can't exceed 5 characters"]
    },
    numOfReviews:{
        type: Number,
        default: 0
    },
    reviews:[{
        user: {
            type: Schema.Types.ObjectId,//gets the  _id from user model
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true
        },
        rating:{
            type: Number,
            required: true
        },
        comment:{
            type: String,
            required: true
        }
    }]
        
},
{timestamps: true});
export default mongoose.model("Product", ProductSchema);