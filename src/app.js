import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app =  express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({
    limit:"160kb"
}))
app.use(express.urlencoded({
    extended:true,
    limit:"150kb"
}))
app.use(express.static("jaha_public_Assets_hae"))
app.use(cookieParser())


//routes
import userRouter from './routes/user.routes.js'

//declaration
app.use("/api/v1/users",userRouter)

export {app}