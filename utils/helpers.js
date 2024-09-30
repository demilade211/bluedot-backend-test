import ErrorHandler from "./errorHandler";
import sendEmail from "./sendEmail";
import fs from "fs"

export const removeTemp = (path) => {
  fs.unlink(path, err => {
    if (err) throw err
  })
}

export const paginate = (items, page, perPage) => {
  return items.slice(perPage * (page - 1), perPage * page);
}

export const handleEmail = async (user, next, res, name, template_uuid, template_variables) => {
  try {
    await sendEmail({
      email: user.email,
      name,
      template_uuid: template_uuid,
      template_variables: template_variables
    })

  } catch (error) {
    if (name === "Spinel Hub OTP") {
      user.otp = undefined;
      user.expiretoken = undefined;

      await user.save({ validateBeforeSave: false })
    }
    return next(new ErrorHandler(error.message, 500))
  }
}

