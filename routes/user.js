import express from "express"
import { verifyToken, verifyUser } from "../utils/verification.js";
import { currentUser, people, editUser, deleteAccount } from "../controllers/user.js";

const router = express.Router();

// just to get access to the route we will use verifyToken and to make action to that 
// route we will use verify user so that only user authenticated with that id can access
// his data
router.get('/currentUser', verifyToken, currentUser);
router.get('/people', people);
router.post('/edit-user/:fieldName', verifyUser, editUser);
router.post('/delete-account', verifyUser, deleteAccount);

export default router