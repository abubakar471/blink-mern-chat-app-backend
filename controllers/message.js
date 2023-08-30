import Message from "../models/Message.js";
import User from "../models/User.js";

export const getMessageBySelectedChatId = async (req, res) => {
    const ourUserId = req.user.userId;
    const { selectedChatUserId } = req.params;

    const messages = await Message.find({
        sender: { $in: [ourUserId, selectedChatUserId] },
        recipient: { $in: [ourUserId, selectedChatUserId] }
    });

    const user = await User.findById(selectedChatUserId);
    res.status(200).json({messages, user});

}