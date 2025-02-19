import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors"
const app= express();

import bookRoute from "./route/Book.route.js"
import userRoute from "./route/user.route.js"

import buyRoute from "./route/buy.route.js"
import sellRoute from "./route/sell.route.js"

dotenv.config()

app.use(cors())

const port = process.env.PORT || 4000

// Middleware to parse JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//connect to mongoDB
const URI= process.env.MongoDBURI

try{
  mongoose.connect(URI);
  console.log("Connected to MongoDB")
}
catch(error){
  console.log("Error: ", error)
}

//defining final route
app.use("/buy", buyRoute)
app.use("/sell", sellRoute)
app.use("/book", bookRoute)
app.use("/user", userRoute)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})