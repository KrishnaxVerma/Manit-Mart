import mongoose from "mongoose";

delete mongoose.connection.models['User'];

const userSchema= mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
})

const User= mongoose.model('User', userSchema)

export default User;