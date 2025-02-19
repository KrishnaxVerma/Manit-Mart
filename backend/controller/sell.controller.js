import Product from "../model/product.model.js"

export const getProduct=async (req, res)=>{
    try {
        const { user } = req.body;
        if (!user || !user.phoneNumber) {
            return res.status(400).json({ message: "Phone number is required" });
        }

        const products = await Product.find({ phoneNumber: user.phoneNumber });

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

export const addProduct= async(req, res)=>{
    try {
        const { name, price, category, imageURL, phoneNumber } = req.body;
        const newProduct = new Product({
            name,
            price,
            category,
            imageURL,
            phoneNumber,
        });
        console.log(newProduct);
        await newProduct.save({message: "Product listed Successfully"}); 

        res.status(200).json();
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};