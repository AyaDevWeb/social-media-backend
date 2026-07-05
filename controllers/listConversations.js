// 📜 Controlador para listar conversaciones activas del usuario

const Conversation = require("../models/conversation.model");

const listConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.find({ participants: userId })
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender",
                    select: "name avatar"
                }
            })
            .populate("participants", "name avatar")
            .sort({ updatedAt: -1 });

        const mapped = conversations.map(conv => {
            const lastMsg = conv.lastMessage;
            const unread = (conv.unreadBy || []).map(id => id.toString());

            return {
                _id: conv._id,
                participants: conv.participants,
                unreadBy: unread,
                created_at: conv.created_at,
                lastMessage: lastMsg
                    ? {
                        _id: lastMsg._id,
                        sender: lastMsg.sender,
                        content: lastMsg.content,
                        type: lastMsg.type,
                        imageUrl: lastMsg.imageUrl,
                        created_at: lastMsg.created_at
                    }
                    : null
            };
        });

        res.status(200).json({ status: "success", conversations: mapped });
    } catch (error) {
        console.error("❌ Error al listar conversaciones:", error);
        res.status(500).json({ status: "error", message: "No se pudo obtener las conversaciones" });
    }
};

module.exports = listConversations;
