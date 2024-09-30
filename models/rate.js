import mongoose from "mongoose"; 

const Schema = mongoose.Schema;


const RateSchema = new Schema({
    currency:{
        type: String,
        required: [true, "Please Currency name"],  
    },
    rate: {
        type: Number, 
        required:true
    }, 
})

module.exports = mongoose.model("rate", RateSchema)