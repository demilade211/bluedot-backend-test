import  express from "express";
//import morgan from "morgan"
import errorMiddleware from "./middlewares/errorsMiddleware"
import auth from "./routes/auth" 
import products from "./routes/product.js"  
import category from "./routes/category.js"    
import cors from "cors"; 



const app = express();

app.use(cors()); 
//app.use(morgan('dev'))
app.use(express.json());
app.use(express.urlencoded({extended: true}));//to handle url encoded data 


app.use('/api/v1',auth); 
app.use('/api/v1',products); 
app.use('/api/v1',category); 


//Middleware to handle errors
app.use(errorMiddleware);

//export default app;
module.exports = app;