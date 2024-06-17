import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/User.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import mongoose from "mongoose";
import { Apiresponse } from "../utils/ApiResponse.js";

const userRegister = asyncHandler(async (req, res) => {
    // username
    // fullName
    // email
    // password
    // avatar
    // validation
    // user already exist or not
    // check for images , check for avatar
    // upload them to cloudinary, check avatar
    // create user object - create enry in db
    // remove password and refresh token from response
    // return response

    const { fullName, username, email, password } = req.body;

    if (
        ["fullName", "username", "email", "password"].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required ")
    }

    const existUser = User.findOne({
        $or: [{ email }, { username }],
    })

    if (existUser) {
        throw new ApiError(409, "User Already Exist, Please try another usernam and email")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log(req.files);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar files is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar files is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"  // it is used to unstored values in database
    )

    if(!userCreated){
        throw new ApiError(404, "Something went wrong while user register")
    }

    return res.status(201).json(
        new Apiresponse(200,userCreated,"User Register Successfully")
    )

})


export { userRegister }