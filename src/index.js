import connectDB from "./db/connectDB.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("Error : " ,error);
        throw err
    })
    
    app.listen(process.env.PORT || 5000 ,()=>{
        console.log(`Server is running on port ${process.env.PORT || 5000}`)
    })
})
.catch((err)=>{
    console.log("MongoDB connection Failed : ",err);
})





/*import express from "express";
const app = express()

(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Error : " ,error);
            throw err
        })

        app.listen(process.env.PORT || 5000,()=>{
            console.log(`App is listining on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.log(error);
        throw error;
    }
})*/