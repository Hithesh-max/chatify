/*
/////////////// UNUSER FOR SQLITE

import mongoose from  "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
       
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    profilePic:{ type: String ,
    default: "https://res.cloudinary.com/dzj8q4l6c/image/upload/v1700000000/default-profile-pic.jpg"

    },

},
{timestamps: true});

const User = mongoose.model("User", userSchema);

export default User;
*/