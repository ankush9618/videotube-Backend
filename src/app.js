import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({ //configuring CORS-cross origin resourse sharing to allow access the routes from auth paths
    origin: process.env.CORS_ORIGIN
}))
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());


import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter) //creating user routes

export { app }