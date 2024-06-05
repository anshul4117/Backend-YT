import mongoose from "mongoose";
import connectDB from "./db/connectDB.js";
import dotenv from "dotenv";


dotenv.config({
    path:'./.env'
})

connectDB();





/*import express from "express";
const app = express()

(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Error : " ,error);
            throw err
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listining on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.log(error);
        throw error;
    }
})*/