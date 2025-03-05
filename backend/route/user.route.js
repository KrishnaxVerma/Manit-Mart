import express from "express"
import { signup, login, updateInfo } from "../controller/user.controller.js";

const router= express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.patch("/updateInfo", updateInfo)

export default router;