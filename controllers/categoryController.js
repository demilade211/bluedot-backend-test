import CategoryModel from "../models/category"
import RateModel from "../models/rate"

export const addCategory = async (req, res, next) => {
    try {
        const { name } = req.body;

        const category = await CategoryModel.create({ name });

        return res.status(201).json({
            success: true,
            data: category
        });

    } catch (error) {
        return next(error)
    }
}

export const addSubcategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const { name } = req.body;

        const category = await CategoryModel.findById(categoryId);

        if (!category) return next(new ErrorHandler("Category not found", 404));

        category.subcategories.push(name);
        await category.save();

        return res.status(201).json({
            success: true,
            data: category
        });

    } catch (error) {
        return next(error)
    }
};

export const getCategories = async (req, res, next) => {
    try {
        const categories = await CategoryModel.find(); 

        return res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        return next(error)
    }
};