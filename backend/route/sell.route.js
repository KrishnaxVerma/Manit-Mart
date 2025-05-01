import express from 'express'
import {getProduct, addProduct, deleteProduct} from "../controller/sell.controller.js"

const router= express.Router()

router.post("/myproduct", getProduct);
router.post("/addproduct", addProduct);
router.delete("/deleteproduct/:productId/:phoneNumber", deleteProduct);

export default router