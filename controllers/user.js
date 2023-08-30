import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const currentUser = async (req, res, next) => {
    try {
        // here in req.user._id, we are grabbing the user from the request body
        // cause while signing in the user in frontend we are saving the user in request body 
        // with jsonwebtoken. in jsonwebtoken they automatically creates an auth object, containing 
        // current user'id and his token expiring infos.
        const user = await User.findById(req.user.userId);
        console.log('currentUser => ', user);
        if (user) { 
            res.status(200).json({ ok: true })
        }
    } catch (err) {
        console.log('current user ctrl occured => ', err);
        return res.sendStatus(400);
    }
}


export const people = async (req, res, next) => {
    try {
        // we grabbing users from db and selecting only _id and username field 1 means true
        const users = await User.find({}, { '_id': 1, username: 1 });
        res.status(200).json(users);
    } catch (err) {
        next(err);
        res.status(500).json("Internal Server Error!")
    }
}

export const editUser = async (req, res, next) => {
    try {
        const fieldName = req.params.fieldName.replace(/\s+/g, '');

        if (fieldName === 'username') {
            const updatedUser = await User.findByIdAndUpdate(req.user.userId, { username: req.body.data }, { new: true }).select("-password");

            res.json(updatedUser);
        }

        if (fieldName === 'changepassword') {
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(req.body.data, salt);
            const updatedUser = await User.findByIdAndUpdate(req.user.userId, { password: hashedPassword }, { new: true }).select("-password");

            res.json(updatedUser);
        }

    } catch (err) {
        next(err);
        res.status(500).json("Internal Server Error!")
    }
}

export const deleteAccount = async (req, res, next) => {
    try {
        const userToDelete = await User.findByIdAndDelete(req.user.userId);

        res.cookie("token", '').status(200).json({
            ok: true
        });
    } catch (err) {
        next(err);
        res.status(500).json("Internal Server Error!")
    }
}