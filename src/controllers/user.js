import asyncHandler from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefrshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh tokens",
    );
  }
};

const userRegister = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //     message:'hy my name is ratnesh gupta'
  // })

  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullname, email, password, username } = req.body;
  // console.log("email", email);

  //   if (fullname === "") {
  //     throw new ApiError(400, "full name is required")
  //   }

  if (
    [fullname, username, password, email].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are compulsory and required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "user  already exist");
  }

  const avatarLocalpath = req.files?.avatar?.[0]?.path;
  const coverImageLocalpath = req.files?.coverImage?.[0]?.path;
  // console.log(req.files)

  if (!avatarLocalpath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalpath);
  const coverImage = await uploadOnCloudinary(coverImageLocalpath);

  if (!avatar) {
    throw new ApiError(502, "Avatar upload to Cloudinary failed");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  // password check
  //access and refresh token
  // send cookie

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email must required");
  }

  const user = await User.findOne({
    $or: [{ username, email }],
  });

  if (!user) {
    throw new ApiError(404, "User Does not exist");
  }
  // console.log(user);

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password not valid !!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefrshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  // console.log("log in user ",loggedInUser);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User Logged in successfully ", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      }),
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  console.log("log out user", logOutUser);

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefeshToken =
    req.cookie.refreshAccessToken || req.body.refreshAccessToken;

  if (incomingRefeshToken) {
    throw new ApiError(401, "Unauthorized access");
  }

  const decodedToken = jwt.verify(
    incomingRefeshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  try {
    const user = await User.findById(decodedToken?._id);
  
    if (!user) {
      throw new ApiError(401, "Invalid refresh token ");
    }
  
    if (incomingRefeshToken!==user?.refreshToken) {
      throw new ApiError(401,"Refrsh token is expired  or used")
    }
  
    const options={
      httpOnly:true,
      secure:true
    }
  
     const { newRefreshToken, accessToken}= await generateAccessAndRefrshTokens(user._id)
  
     return res.status(200)
     .cookie("accessToken", accessToken,options)
     .cookie("refreshToken",newRefreshToken,options)
    .json{
      new ApiResponse(
        200, 
        {accessToken,RefreshToken:newRefreshToken},"Accessed Token Refreshed successfully"
      )
    }
  } catch (error) {
    throw new ApiError(401, error?.message ||"Invalid refresh token")
  }

});

export { userRegister, loginUser, logOutUser,refreshAccessToken };
