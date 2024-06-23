import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.modal.js"
import { cloudinaryDelete, uploadOnCloudinary } from "../utils/cloudinary.js"
import { Apiresponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


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

});


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
});


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
});


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
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new Apiresponse(
                    200,
                    {
                        accessToken, refreshToken: newRefreshToken
                    },
                    "Access Token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, "Invalid refresh Token");
    }


});


const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new Apiresponse(200, {}, "Passsword Changed Successfully"));

});

const getCurrentUser = asyncHandler(async (req, res) => {
    // const user = await User.findById(req.user?._id);
    return res
        .status(200)
        .json(new Apiresponse(200, req.user, "User fetched successfully"))
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "Please provide all required fields");
    }

    const user = await User.findOneAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email,
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200).json(
        new Apiresponse(200, user, "Account details updated successfully")
    )

});

const updateAvatarImage = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing ");
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath);

    // const user = await User.findByIdAndUpdate(
    //     req.user?._id,
    //     {
    //         $set: {
    //             avatar: avatar.url
    //         }
    //     },
    //     { new: true }
    // ).select("-password");

    const user = await User.findById(req.user?._id);
    const oldAvatarUrl = user?.avatar;

    await cloudinaryDelete(oldAvatarUrl);
    const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath)
    user.avatar = uploadedAvatar?.url
    await user.save();


    res.status(200).json(
        new Apiresponse(200, user, "Avatar updated successfully")
    )



});

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Avatar file is missing ");
    }

    // const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // const user = await User.findByIdAndUpdate(
    //     req.user?._id,
    //     {
    //         $set: {
    //             coverImage: coverImage.url
    //         }
    //     },
    //     { new: true }
    // ).select("-password");

    const user = await User.findById(req.user?._id);
    const oldAvatarUrl = user?.coverImage;

    await cloudinaryDelete(oldcoverImage);
    const uploadedCoverImage = await uploadOnCloudinary(coverImageLocalPath)
    user.avatar = uploadedCoverImage?.url
    await user.save();

    return res.status(200).json(
        new Apiresponse(200, user, "Cover Image Updated")
    )
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions", // in db, all modal is save as in lowerCase and with (s)
                localField: "_id",
                foreignField: "channel",
                as: "suscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions", // in db, all modal is save as in lowerCase and with (s)
                localField: "_id",
                foreignField: "suscriber",
                as: "suscribedTo"
            }
        },
        {
            $addFields: {
                suscribersCount: {
                    $size: "$suscribers"
                },
                channelsSuscribedToCount: {
                    $size: "$suscribedTo"
                },
                isSuscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$suscribers.suscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                suscribersCount: 1,
                channelsSuscribedToCount: 1,
                isSuscribed: 1,
                coverImage: 1,
                avatar: 1,

            }
        }
    ])


    console.log("channel Data :", channel);

    if (!channel?.length) {
        throw new ApiError(404, "channnel does not exists")
    }

    return res.status(200).json(
        new Apiresponse(200, channel[0], "User channel fetched successfully")
    )

})


const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                to: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: owner
                            }
                        }
                    }
                ]
            }
        },

    ]);


    return res.status(200).json(
        new Apiresponse(
            200,
            user[0].watchHistory,
            "Watch Histroy fetched Successfully"
        )
    )
})


export {
    userRegister,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatarImage,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}