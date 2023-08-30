import jwt from "jsonwebtoken";
import { createError } from "../utils/error.js";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log('req',req);
  console.log('req', req.cookies);
  if (!token) {
    console.log("no token found");
    return res.status(401).json("You are not authenticated!");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("jwt verification error");
      return res.status(403).json("Token is not valid");
    };

    console.log("verification token found and set to req obj => ", token)
    req.user = user;

  });

  next();
};

export const verifyUser = (req, res, next) => {
  verifyToken(req, res, next, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      return next(createError(401, "You are not authorized!"));
    }
  });
};

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, next, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      return next(createError(401, "You are not authorized!"));
    }
  });
};