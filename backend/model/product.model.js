import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { 
        type: String, 
        enum: ["Accessories", "Electronics", "Books", "Stationary"], 
        required: true 
    },
    imageURL: { type: String, required: true },
    phoneNumber: {type: Number, required: true}
});

const Product = mongoose.model("Product", productSchema);

export default Product;
