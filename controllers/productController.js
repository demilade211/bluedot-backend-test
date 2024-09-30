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

// Create new review   =>   /api/v1/review
export const createProductReview = async (req, res, next) => {

    const { _id, name } = req.user;
    const { rating, comment, productId } = req.body;

    try {
        const review = {
            user: _id,
            name: name,
            rating: Number(rating),
            comment
        }

        const product = await ProductModel.findById(productId);

        const isReviewed = product.reviews.find(
            r => r.user.toString() === _id.toString()
        )

        if (isReviewed) {
            product.reviews.forEach(review => {
                if (review.user.toString() === _id.toString()) {
                    review.comment = comment;
                    review.rating = rating;
                }
            })

        } else {
            product.reviews.push(review);
            product.numOfReviews = product.reviews.length
        }

        product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

        await product.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true
        })

    } catch (error) {
        return next(error)
    }

}


// Get Product Reviews   =>   /api/v1/reviews
export const getProductReviews = async (req, res, next) => {
    try {
        const product = await ProductModel.findById(req.query.id);

        res.status(200).json({
            success: true,
            reviews: product.reviews
        })
    } catch (error) {
        return next(error)
    }
}

// Delete Product Review   =>   /api/v1/reviews
export const deleteReview = async (req, res, next) => {

    try {
        const product = await ProductModel.findById(req.query.productId);

        console.log(product);

        const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());

        const numOfReviews = reviews.length;

        const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

        await ProductModel.findByIdAndUpdate(req.query.productId, {
            reviews,
            ratings,
            numOfReviews
        }, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        })

        res.status(200).json({
            success: true
        })
    } catch (error) {
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

export const addToWishlist = async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user.id; // Assuming you have middleware to authenticate users and attach the user to req

    try {
        const user = await UserModel.findById(userId);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        const product = await ProductModel.findById(productId);

        if (!product) {
            return next(new ErrorHandler("Product not found", 404));
        }

        // Check if the product is already in the user's wishlist
        const existingWishlistItem = user.wishItems.find(item => item.product.toString() === productId);

        if (existingWishlistItem) {
            return next(new ErrorHandler("Product is already in the wishlist", 400));
        }

        // If the product is not in the wishlist, add it
        user.wishItems.unshift({ product: productId });

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Product added to wishlist successfully'
        });
    } catch (error) {
        next(error);
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

export const removeFromWishlist = async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user.id;

    try {
        const user = await UserModel.findById(userId);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Find the index of the product in the wishlist
        const wishlistIndex = user.wishItems.findIndex(item => item.product.toString() === productId);

        if (wishlistIndex !== -1) {
            // If the product is found in the wishlist, remove it
            user.wishItems.splice(wishlistIndex, 1);
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Product removed from wishlist successfully'
            });
        } else {
            return next(new ErrorHandler("Product not found in the wishlist", 404));
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

export const sendQuotationToEmail = async (req, res, next) => {
    const {
        name,
        country,
        state,
        city,
        zipCode,
        phone,
        streetAdress,
    } = req.body;

    // Check if any field is missing
    const requiredFields = ["name", "country", "state", "city", "zipCode", "phone", "streetAdress"];
    const missingField = requiredFields.find(field => !req.body[field]);
    if (missingField) {
        return next(new ErrorHandler(`${missingField} is required`, 400));
    }

    try {
        const user = await UserModel.findById(req.user._id).populate("cartItems.product");
        // Create new quotation
        const newQuotation = {
            user: req.user._id,
            name,
            country,
            state,
            city,
            zipCode,
            phone,
            streetAdress,
        }; 
        const quotation = await QuotationModel.create(newQuotation);


        // Send email containing the quotation details
        await handleEmail({ ...newQuotation, email: req.user.email }, next, res, "Quotation from Spinel Hub", "52d48f3e-bc3e-4047-9d0c-80d296cda397", {
            "name": name,
            "email": req.user.email,
            "country": country,
            "state": state,
            "city": city,
            "zipCode": zipCode,
            "phone": phone,
            "streetAdress": streetAdress,
            "cart": user.cartItems,
            "total": user.cartItems.reduce(
                (accumulator, currentValue) => accumulator + currentValue.product.price,
                0,
            )
        });

        await handleEmail({ ...newQuotation, email: "quotations@spinelhub.com" }, next, res, "Quotation for Spinel Hub", "52d48f3e-bc3e-4047-9d0c-80d296cda397", {
            "name": name,
            "email": req.user.email,
            "country": country,
            "state": state,
            "city": city,
            "zipCode": zipCode,
            "phone": phone,
            "streetAdress": streetAdress,
            "cart": user.cartItems,
            "total": user.cartItems.reduce(
                (accumulator, currentValue) => accumulator + currentValue.product.price,
                0,
            )
        });

        return res.status(200).json({
            success: true,
            message: "Quotation sent successfully",
            quotation: newQuotation
        });
    } catch (error) {
        return next(error);
    }
};
