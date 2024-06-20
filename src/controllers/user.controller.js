import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.modal.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Apiresponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;  // add the refresh token in Database
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Somthing went wrong while generating refresh and access token");
    }
}


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

    const existUser = await User.findOne({
        $or: [{ email }, { username }],
    })

    if (existUser) {
        throw new ApiError(409, "User Already Exist, Please try another username and email")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // console.log(req.files);

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

    if (!userCreated) {
        throw new ApiError(404, "Something went wrong while user register")
    }

    return res.status(201).json(
        new Apiresponse(200, userCreated, "User Register Successfully")
    )

})



const loginUser = asyncHandler(async (req, res, next) => {
    const { username, email, password } = req.body;

    console.log("login")
    // req body
    // username or email validate
    // find user in db 
    // password check
    // access and refresh token 
    // send cookie

    if (!(username || email)) {
        throw new ApiError(400, "Username or Email is required")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (!user) {
        throw new ApiError(400, "Password is required");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Credentials");
    }


    const loggedInUser = await User.findById(user._id)
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);


    // create cookie
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new Apiresponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User Login Successfully")
        )
})


const logOutUser = asyncHandler(async (req, res) => {
    // logout also need a userId for find the user So, we need middleWare
    const user = req.user._id;
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // we can set any value in property in db using set 
            $set: {
                refreshToken: undefined
            }
        },
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new Apiresponse(200, {}, "User Logout Successfully")
        )
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    // we need to check if the refreshToken is present in the cookies
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorization Access")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id);
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired or used");
        }
    
        const options  = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id);
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new Apiresponse(
                200,
                {
                    accessToken,refreshToken:newRefreshToken
                },
                "Access Token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,"Invalid refresh Token");
    }
    

})

export { userRegister, loginUser, logOutUser ,refreshAccessToken}