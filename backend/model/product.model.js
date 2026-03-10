import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { 
        type: String, 
        enum: ["Accessories", "Electronics", "Books", "Stationary", "Others"], 
        required: true 
    },
    imageUrls: [{ type: String, required: true }],
    sellerEmail: {type: String, required: true},
    sellerId: {type: String, required: true},
    condition: {
        type: String,
        enum: ["Like New", "Good", "Fair", "Poor"],
        default: "Good"
    },
    description: { type: String },
    interested: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model("Product", productSchema);

export default Product;
