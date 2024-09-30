import app from "./app.js";
import dotenv from "dotenv";
import connectDb from "./db/db.js" 
import cloudinary from "cloudinary"

// Handle Uncaught exceptions
process.on('uncaughtException', err => {
    console.log(`ERROR: ${err.stack}`);
    console.log('Shutting down due to uncaught exception');
    process.exit(1)
})

process.on('SIGTERM', err => {
    process.exit(1)
})

dotenv.config({path: "config/config.env"});

connectDb();

const PORT = process.env.PORT || 8000; 

// setting up cloudinary configurations
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRETE
})



const server = app.listen(PORT, () => {
    console.log(`Server connected on Port: http://localhost:${PORT} in ${process.env.NODE_ENV} MODE`);
});

//Handle unhandled promise rejections
process.on("unhandledRejection",err=>{
    console.log(`ERROR: ${err.message}`);
    console.log(`Shutting down due to unhandled promise rejection`);
    server.close(()=>{
        process.exit(1);
    })
})