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
        console.log(error);
        res.status(500).json({ message: "Server Error", error });
    }
};

export const deleteProduct= async (req, res) => {
    try {
        const { productId, phoneNumber } = req.params;
        
        if (!productId || !phoneNumber) {
          return res.status(400).json({ 
            success: false, 
            message: 'Product ID and phone number are required' 
          });
        }
    
        // Find the product with the given ID
        const product = await Product.findById(productId);
        
        // Check if product exists
        if (!product) {
          return res.status(404).json({ 
            success: false, 
            message: 'Product not found' 
          });
        }
        
        // Verify that the requester is the owner of the product
        // console.log(phoneNumber, product.phoneNumber)
        if (product.phoneNumber != phoneNumber) {
          return res.status(403).json({ 
            success: false, 
            message: 'You are not authorized to delete this product' 
          });
        }
        
        // Delete the product
        await Product.findByIdAndDelete(productId);
        
        return res.status(200).json({ 
          success: true, 
          message: 'Product deleted successfully' 
        });
        
      } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to delete product', 
          error: error.message 
        });
      }
  };