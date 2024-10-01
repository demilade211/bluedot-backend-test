import ProductModel from "../models/product.js"
import UserModel from "../models/user.js"
import ErrorHandler from "../utils/errorHandler.js";
import APIFeatures from "../utils/apiFeatures.js";
import products from "../data/products.json"
import cloudinary from "cloudinary"
import { removeTemp } from "../utils/helpers.js"
import QuotationModel from "../models/quotation";
import { handleEmail } from "../utils/helpers";


//To create a new product
export const createProduct = async (req, res, next) => {
    const { name, category, subCategory, price, stock, description } = req.body;
    const { _id } = req.user
    try {
        req.body.user = req.user._id

        // Check if files were uploaded
        if (!req.files || Object.keys(req.files).length === 0) {
            return next(new ErrorHandler('No files were uploaded.', 400));
        }

        const filesArray = Object.values(req.files); // Assuming your input field is named 'image'


        // Upload images to Cloudinary and get URLs
        const imageUrls = await Promise.all(
            filesArray.map(async (file) => {
                const result = await cloudinary.v2.uploader.upload((Array.isArray(file) ? file[0].tempFilePath : file.tempFilePath), {
                    folder: 'products',
                    crop: "scale",
                    resource_type: "image"
                });
                removeTemp((Array.isArray(file) ? file[0].tempFilePath : file.tempFilePath))
                return {
                    public_id: result.public_id,
                    url: result.secure_url
                }
            })
        );

        // Save product data to MongoDB
        const newProduct = {
            user: _id,
            name,
            category,
            subCategory,
            price,
            description,
            stock,
            images: imageUrls,
        };
        const product = await ProductModel.create(newProduct);

        return res.status(201).json({
            success: true,
            product
        })

    } catch (error) {
        return next(error)
    }
}

export const createManyProducts = async (req, res, next) => {
    try {
        req.body.user = req.user._id

        const newP = products.map(val => {
            return {
                user: req.user._id,
                ...val
            }
        })
        console.log(products);

        const product = await ProductModel.create(newP);

        return res.status(201).json({
            success: true,
            product
        })

    } catch (error) {
        return next(error)
    }
}

export const searchProducts = async (req, res, next) => {
    const { _id } = req.user;
    const { searchText } = req.params

    if (searchText.length < 1) return next(new ErrorHandler("Search text can't be less than 1", 200));

    try {
        const results = await ProductModel.find({
            name: { $regex: searchText, $options: "i" }//i means it shouldnt be case sensitive
        })

        return res.status(200).json({
            success: true,
            results
        })

    } catch (error) {
        return next(error)
    }
}

//To get all products => api/products?keyword=apple
export const getProducts = async (req, res, next) => {
    const resultsPerPage = 6;


    try {
        const productsCount = await ProductModel.countDocuments()
        const apiFeatures = new APIFeatures(ProductModel.find().sort({ createdAt: -1 }), req.query).search().filter()

        let products = await apiFeatures.query;//get the result after implementing the functions
        let filteredProductCount = products.length;
        /**
        This searches for the query in the database with the search method
        After searching? the result gotten is used to execute the filter method
         */
        apiFeatures.pagination(resultsPerPage)
        products = await apiFeatures.query.clone();// clone was use because  await apiFeatures.query couldnt run twice

        return res.status(200).json({
            success: true,
            count: products.length,
            productsCount,
            resultsPerPage,
            filteredProductCount,
            products

        })

    } catch (error) {
        return next(error)
    }
}

//To get single product
export const getOneProduct = async (req, res, next) => {
    const { productId } = req.params

    try {
        const product = await ProductModel.findById(productId);
        const user = await UserModel.findOne({ _id: product.user })

        if (!product) {
            return next(new ErrorHandler("Product not found", 401))
        }


        let cart = user?.cartItems.filter(val => productId === val.product._id.toString())

        return res.status(200).json({
            success: true,
            product,
            cartQuantity: cart[0]?.quantity || 1

        })
    } catch (error) {
        return next(error)
    }
}

//To update the product
export const updateProduct = async (req, res, next) => {
    const { productId } = req.params;
    try {

        let product = await ProductModel.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            })
        }

        product = await ProductModel.findByIdAndUpdate(productId, req.body, { new: true, runValidator: true, useFindAndModify: false })

        return res.status(200).json({
            success: true,
            product
        })

    } catch (error) {
        return next(error)
    }
}

//To delete product
export const deleteProduct = async (req, res, next) => {
    const { productId } = req.params;
    try {

        let product = await ProductModel.findById(productId);

        if (!product) {
            return next(new ErrorHandler('Product not found.', 404))
        }

        await ProductModel.deleteOne({ _id: productId });

        return res.status(200).json({
            success: true,
            message: "Product has been deleted"
        })

    } catch (error) {
        console.log(error);
        return next(error)
    }
}
 
export const addToCart = async (req, res, next) => {
    const { quantity } = req.body;
    const { productId } = req.params;
    const userId = req.user.id; // Assuming you have middleware to authenticate users and attach the user to req

    try {
        const user = await UserModel.findById(userId);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        const product = await ProductModel.findById(productId);

        if (!product) {
            return next(new ErrorHandler("Product not found", 200));
        }

        // Check if the product is already in the user's cart
        const existingCartItem = user.cartItems.find(item => item.product.toString() === productId);

        if (existingCartItem) {
            // If the product is already in the cart, update the quantity
            existingCartItem.quantity += Number(quantity) || 1;
        } else {
            // If the product is not in the cart, add it
            user.cartItems.unshift({ product: productId, quantity: quantity || 1 });
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Product added to cart successfully'
        });
    } catch (error) {
        return next(error);
    }
}; 

export const removeFromCart = async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user.id;

    try {
        const user = await UserModel.findById(userId);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Find the index of the product in the cart
        const productIndex = user.cartItems.findIndex(item => item.product.toString() === productId);

        if (productIndex !== -1) {
            // If the product is found in the cart, remove it
            user.cartItems.splice(productIndex, 1);
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Product removed from cart successfully'
            });
        } else {
            return next(new ErrorHandler("Product not found in the cart", 404));
        }
    } catch (error) {
        next(error);
    }
}; 

export const updateCartQuantity = async (req, res, next) => {
    const { productId } = req.params;
    const { action, quantity } = req.body;
    const userId = req.user.id;

    try {
        const user = await UserModel.findById(userId);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        const product = await ProductModel.findById(productId);

        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        const existingCartItem = user.cartItems.find(item => item.product.toString() === productId);

        if (!existingCartItem) {
            return next(new ErrorHandler("Product not found in the cart", 404));
        }

        switch (action) {
            case 'increase':
                existingCartItem.quantity += Number(quantity) || 1;
                break;
            case 'reduce':
                if (existingCartItem.quantity > 1) {
                    existingCartItem.quantity -= Number(quantity) || 1;
                } else {
                    // Optionally, you can remove the item from the cart if quantity becomes zero
                    // user.cartItems = user.cartItems.filter(item => item.product.toString() !== productId);
                }
                break;
            default:
                return next(new ErrorHandler("Invalid action", 400));
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: `Cart quantity ${action}d successfully`
        });
    } catch (error) {
        return next(error);
    }
}; 
