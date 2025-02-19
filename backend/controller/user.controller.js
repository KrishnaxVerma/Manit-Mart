import User from "../model/user.model.js";
import bcryptjs from "bcryptjs";

// Signup function
export const signup = async (req, res) => {
    try {
        const { fullname, phoneNumber, password } = req.body;

        // Validate input
        if (!fullname || !phoneNumber || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create and save the new user
        const newUser = new User({
            fullname,
            phoneNumber,
            password: hashedPassword
        });
        await newUser.save();

        return res.status(201).json({ message: "User created successfully", user:{
            _id: newUser._id,
            fullname: newUser.fullname,
            phoneNumber: newUser.phoneNumber
        } });
    } catch (error) {
        console.error("Error during signup: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Login function
export const login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        // Validate input
        if (!phoneNumber || !password) {
            return res.status(400).json({ message: "Phone Number and password are required" });
        }

        // Find the user
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(400).json({ message: "Invalid Phone Number or password" });
        }

        // Compare passwords
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Phone Number or password" });
        }

        // Successful login
        return res.status(200).json({
            message: "Login successful",
            user: {
                _id: user._id,
                fullname: user.fullname,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        console.error("Error during login: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};
