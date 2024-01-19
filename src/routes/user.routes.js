import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import {registerUser} from "../controllers/user.controllers.js";


const router = Router()

//image bhej paayenge
router.route("/register").post(upload.fields([
    {name:"avtar",
     maxCount:1
    },

    {name:"coverimage",
maxCount:1
}
]),
    registerUser)

export default router