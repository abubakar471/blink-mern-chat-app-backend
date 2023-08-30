import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const Register = async (req, res, next) => {
    try {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(req.body.password, salt);

        const existedUser = await User.findOne({ username: req.body.username });

        if (existedUser) {
            return res.status(400).json("User already exists!");
        }
        const newUser = await User({
            ...req.body,
            password: hashedPassword
        });

        await newUser.save();

        res.status(200).json({
            ok: true
        })
    } catch (error) {
        next(error);
        res.status(500).json("Internal server error!");
    }
}

export const Login = async (req, res, next) => {
    try {
        console.log(req.body)
        const user = await User.findOne({ username: req.body.username });

        if (!user) {
            return res.status(404).json("No user found");
        };

        const isPasswordCorrect = await bcrypt.compare(
            req.body.password,
            user.password
        );
        if (!isPasswordCorrect) {
            return res.status(400).json("Wrong password or username!");
        }

        jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: "30d"
        }, (err, token) => {
            if (err) throw err;

            const { password, ...otherDetails } = user._doc;
            console.log("setting cookie with this token => ", tFoken);
            res.cookie("token", token, { sameSite: "none", secure: true }).status(200).json({
                user: { ...otherDetails },
                token
            });

        });

        return res
    } catch (err) {
        next(err);
        res.status(500).json("Internal server error!");
    }

}

export const Logout = async (req, res, next) => {
    try {
        res.cookie("token", '').status(200).json({
            ok: true
        });
    } catch (err) {
        next(err);
        res.status(500).json("Internal server error!");
    }
}