import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import {logInUser,
     logOutUser,
      registerUser,
     updateRefreshToken} from "../controllers/user.controllers.js";
import { authVerify } from "../middlewares/auth.middlewares.js";


const router = Router()

//image bhej paayenge
router.route("/register").post(upload.fields([
    {
        name:"avtar",
        maxCount: 1
    },

    {
        name:"coverImage",
        maxCount: 1
    }
]),
    registerUser)

router.route("/login").post(logInUser)



router.route("/logout").post(authVerify ,logOutUser)
router.route("/refresh-token").post(updateRefreshToken)

export default router