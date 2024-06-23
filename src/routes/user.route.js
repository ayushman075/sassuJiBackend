import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { loginUser, registerUser } from "../controllers/user.controller.js";

const userRouter = Router()

userRouter.route("/register").post(
  upload.single('avatar'),
    registerUser
);
userRouter.route("/login").post(
  loginUser
)

// userRouter.route("/logout").post(
//   verifyJWT,
//   logoutUser
// )

// userRouter.route("/updatedetails").post(
//   verifyJWT,
//   updateUserDetails
// )

// userRouter.route("/updateavatar").post(
//   verifyJWT,
//   upload.single('avatar'),
//   updateAvatar
// )

// userRouter.route("/refresh-token").post(refreshAccessToken)

// userRouter.route("/getcurrentuser").post(verifyJWT,getCurrentUser)

export {userRouter}