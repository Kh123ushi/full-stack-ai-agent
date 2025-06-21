import brcypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { inngest } from "../inngest/client.js";

export const signup = async (req, res) => {

    const { email, password, skills = [] } = req.body
    try {
        const hashed = brcypt.hashSync(password, 10);
        const user = await User.create({
            email,
            password: hashed,
            skills
        })

        //fire inngest event
        await inngest.send({
            name: "user/signup",
            data: {
                email
            }
        });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
        );
        res.json({ user, token });


    }
    catch (error) {
        res.status(500).json({
            message: "Failed to create user",
            error: error.message
        });
    }

}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = User.findOne({ email })
        if (!user) return res.status(401).json({ error: "USER NOT FOUND" });

        const isMatch = await brcypt.compare(password, user.password);

        if (!isMatch) return res.status(401).json({ error: "INVALID CREDENTIALS" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
        );
        res.json({ user, token });


    }
    catch (error) {
        res.status(500).json({
            message: "Failed to login",
            error: error.message
        })
    }
}

export const logout = async (req, res) => {
    try {

        //BEARER TOKENVALUE -> HERE WE ONLY NEED TOKENVALUE
        const token = req.headers.authorization.split(" ")[1];
        if (!token) return res.status(401).json({ error: "UNAUTHORIZED" });
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: "UNAUTHORIZED" });
                res.json({ message: "LOGGED OUT SUCCESSFULLY" });
            }
        })
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to logout",
            error: error.message
        })
    }
}

export const updateUser = async (req, res) => {
    const { skills = [], role, email } = req.body;
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "FORBIDDEN - ONLY ADMINS CAN UPDATE USERS" });
        }
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "USER NOT FOUND" });

        await User.updateOne(
            { email },
            { skills: skills.length ? skills : user.skills, role }
        )
        return res.json({ message: "USER UPDATED SUCCESSFULLY" })
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed to update user",
            error: error.message
        });
    }
}

export const getUser = async (req, res) => {
//*****************************8 */
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "FORBIDDEN - ONLY ADMINS CAN GET USERS" });
        }
        const users = await User.find().select("-password")
        return res.json(users);
    }

    catch (error) {
        return res.status(500).json({
            message: "Failed to get user",
            error: error.message
        });
    }
}