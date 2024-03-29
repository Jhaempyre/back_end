import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import {logInUser,
     logOutUser,
     registerUser,
     updateRefreshToken,
     updatePassword,
     getCurrentUserDetails,
     updateUserDetails,
     updateAvtarImage,
     updateCoverImage
    } from "../controllers/user.controllers.js";
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



// routes that require middlewware execution
router.route("/logout").post(authVerify ,logOutUser)
router.route("/refreshtoken").post(updateRefreshToken)
router.route("/updatepassword").post(authVerify,updatePassword)
router.route("/userdetails").post(authVerify,getCurrentUserDetails)
router.route("/updatedetails").patch(authVerify,updateUserDetails)
router.route("/updateAvtar").patch(authVerify,upload.single("avtar"),updateAvtarImage)
router.route("/updatecoverimage").patch(authVerify,upload.single("coverImage"),updateCoverImage)
export default router