import Guest from "../models/guest"; // Adjust path if needed

// Add a new guest
export const addGuest = async (req, res, next) => {
  try {
    const { email, firstName, lastName, guest } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    // Check for duplicate email
    const existingGuest = await Guest.findOne({ email });
    if (existingGuest) {
      return res.status(400).json({ success: false, message: "Email already exists." });
    }

    // Create a new guest
    const newGuest = await Guest.create({
      email,
      firstName,
      lastName,
      guest,
    });

    res.status(201).json({
      success: true,
      message: "Guest added successfully.",
      data: newGuest,
    });
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
};

// Get all guests with pagination
export const getAllGuests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 guests per page
    const skip = (page - 1) * limit;

    // Get paginated guests
    const guests = await Guest.find().skip(skip).limit(limit);

    // Get total guest count
    const totalGuests = await Guest.countDocuments();

    res.status(200).json({
      success: true,
      data: guests,
      pagination: {
        total: totalGuests,
        currentPage: page,
        totalPages: Math.ceil(totalGuests / limit),
        limit,
      },
    });
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
};
