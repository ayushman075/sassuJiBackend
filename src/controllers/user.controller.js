import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadFileOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const generateAccessAndRefreshToken = async  (userId) => {
    try {
     const user =  await User.findById(userId)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()
  
    user.refreshToken=refreshToken
    await user.save({validateBeforeSave:false})
  
    return {accessToken,refreshToken}
    } catch (error) {
      throw new ApiError(500,"Something went wrong while generating access and refresh token !!")
    }
  }

  const registerUser = asyncHandler(
    async (req,res)=>{
        
       const {username,email,password,role,firstName,lastName,address,phoneNumber,avatarPic,businessName,businessAddress,taxId,shippingAddress,paymentMethods} =req.body


      if([username,role,email,password,phoneNumber,firstName,lastName].some((field)=>{
        return field===""||field===undefined
      })){
       res.status(400).json(new ApiResponse(400,{},"Some fields are empty!!",false))
        throw new ApiError(400,"Some fields are empty!!")
      }

      
    

     const existedUser = await User.findOne({email:email})
      if(existedUser){
       res.status(409).json(new ApiResponse(409,{},"User with email already exists !!",false))
        throw new ApiError(409, "User with email already exists !!")
      }

     const avatarLocalPath = req.file?.path;
     var avatar="";
     
    if(avatarLocalPath){
      avatar= await uploadFileOnCloudinary(avatarLocalPath);
    }

    const user = await User.create({
        username,
        email,
        password,
        role,
        profile:
                {
                    firstName,
                    lastName,
                    address,
                    phoneNumber,
                    avatar
                },
        sellerDetails:{
            businessName,
            businessAddress,
            taxId
        },
        buyerDetails:{
            shippingAddress,
            paymentMethods
        },
               
        
    })

    const checkUser = await User.findById(user._id).select("-password -refreshToken");

    if(!checkUser){
       res.status(500).json(new ApiResponse(500,{},"Something went wrong while registring user !!",false))
        throw new ApiError(500, "Something went wrong while registring user !!")
    }

    return res.status(201).json(new ApiResponse(200,checkUser,"User created sucessfully",true))

    }
)



const loginUser=asyncHandler(async (req,res)=>{
   
    
    const {email,password}=req.body
    if(email=="" || email==undefined || !email){
        res.status(400,{},"Email is required",false)
          throw new ApiError(400,"Email is required !!")
    }
    else if(password=="" || password==undefined || !password){
        res.status(400).json(new ApiResponse(400,{},"Password is required !!",false))
       
          throw new ApiError(400,"Password is required !!")
    }
    
    const user = await User.findOne({"email":email})
    
    if(!user){
        res.status(404).json(new ApiResponse(404,{},"User doesn't exist !!",false))
      throw new ApiError(404,"User doesn't exist !!")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        res.status(400).json(new ApiResponse(400,{},"Invalid user credentials !!",false))
      throw new ApiResponse(401,"Invalid user credentials !!")
    }
    const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id)
    
    const loggedInUser = await User.findById(user._id).
                          select("-password -refreshToken")
    
                          const options={
                             httpOnly:true,
                             sameSite: 'Lax'
                            // secure:true
                          }
    
                          return res
                          .status(200)
                          .cookie("accessToken",accessToken,options)
                          .cookie("refreshToken",refreshToken,options)
                          .json(
                            new ApiResponse(
                              200,
                              {
                                user:loggedInUser,accessToken,refreshToken
                              },
                              "User logged in sucessfully !!",
                              true
                            )
                          )
    
    })


export {registerUser,loginUser}