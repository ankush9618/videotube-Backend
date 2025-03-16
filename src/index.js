import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });


const port = process.env.PORT || 8000;
connectDB() //calling method to connect to database
    .then(() => {
        app.on("Error", (err) => { //checking for the app throwing any error
            console.log("Connection to the Server Failed", err);
        })
        app.listen(port, () => {
            console.log("Server is listening on port:", port);
        })
    })
    .catch((err) => {
        console.log("Failed to Connect with Database:", err);
    })