import asyncHandler from "../utils/asynchandler.js";

const userRegister = asyncHandler(async (req , res)=>{
    res.status(200).json({
        message:'hy my name is ratnesh gupta'
    })
})

export default userRegister;