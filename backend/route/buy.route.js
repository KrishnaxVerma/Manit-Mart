import express from 'express'
import {getProduct} from "../controller/buy.controller.js"

const router= express.Router()

router.get("/", getProduct);

export default router