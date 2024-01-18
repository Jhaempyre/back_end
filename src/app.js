import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app =  express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({
    limit:"16kb"
}))
app.use(express.urlencoded({
    extended:true,
    limit:"15kb"
}))
app.use(express.static("public"))//public asset hae jaha 
app.use(cookieParser())


//routes
import userRouter from './routes/user.routes.js'

//declaration
app.use("/api/v1/users",userRouter)

export {app}