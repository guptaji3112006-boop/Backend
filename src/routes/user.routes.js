import { Router } from "express";
import { userRegister, loginUser, logOutUser } from "../controllers/user.js";
import { upload } from "../middlewares/multer.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  userRegister,
);

router.route("/login").post(loginUser);

//secured route

router.route("/logout").post(verifyJwt, logOutUser);
export default router;
