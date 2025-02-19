import express from 'express'
import {getProduct, addProduct} from "../controller/sell.controller.js"

const router= express.Router()

router.post("/myproduct", getProduct);
router.post("/addproduct", addProduct);

export default router