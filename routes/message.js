import express from "express"
import { verifyToken } from "../utils/verification.js";
import { getMessageBySelectedChatId } from "../controllers/message.js";

const router = express.Router();

router.get('/:selectedChatUserId', verifyToken, getMessageBySelectedChatId);

export default router