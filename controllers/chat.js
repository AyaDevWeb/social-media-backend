const mongoose = require("mongoose");
const path = require("path");
const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");

/* === 🗨️ Crear conversación entre dos usuarios === */
const createConversation = async (req, res) => {
    try {
        const senderId = req.user?.id;
        const recipientId = req.params?.userId;

        if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ status: "error", message: "ID de usuario no válido" });
        }

        if (senderId === recipientId) {
            return res.status(400).json({ status: "error", message: "No se puede crear una conversación contigo mismo" });
        }

        const idA = new mongoose.Types.ObjectId(senderId);
        const idB = new mongoose.Types.ObjectId(recipientId);

        let chat = await Conversation.findOne({
            participants: { $all: [idA, idB] }
        });

        if (!chat) {
            chat = new Conversation({
                participants: [idA, idB],
                unreadBy: [idB]
            });
            await chat.save();
            console.log("🆕 Conversación creada:", chat._id);
        } else {
            console.log("🔎 Conversación ya existente:", chat._id);
        }

        res.status(200).json({ status: "success", conversation: chat });
    } catch (error) {
        console.error("❌ Error al crear/obtener conversación:", error);
        res.status(500).json({ status: "error", message: "No se pudo iniciar la conversación" });
    }
};

/* === 📨 Enviar mensaje de texto o imagen === */
const sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const sender = req.user.id;
        const senderId = new mongoose.Types.ObjectId(sender);
        const cleanId = conversationId.trim();
        const { content = "", type = "text" } = req.body;
        let imageUrl = null;

        if (req.file && type === "image") {
            const filename = req.file.filename;
            imageUrl = `/uploads/chat/${filename}`;
        }

        const message = new Message({
            conversation: cleanId,
            sender,
            content,
            type,
            delivered: true,
            imageUrl
        });

        await message.save();

        const populated = await Message.findById(message._id)
            .populate("sender", "name avatar");

        const conversation = await Conversation.findById(cleanId);

        if (conversation && Array.isArray(conversation.participants)) {
            const senderStr = senderId.toString();
            const participantsStr = conversation.participants.map(p => p.toString());
            const recipients = participantsStr.filter(p => p !== senderStr);

            conversation.unreadBy = recipients;
            conversation.lastMessage = message._id;

            await conversation.save();

            populated.conversationId = cleanId;

            const io = req.app.get("socketio");

            recipients.forEach(recipientId => {
                io.to(recipientId).emit("new-message", populated);
                io.to(recipientId).emit("message-received", { conversationId: cleanId });
            });

            io.to(cleanId).emit("message-updated", { conversationId: cleanId });

            res.status(200).json({ status: "success", message: populated });
        } else {
            res.status(404).json({ status: "error", message: "Conversación no válida" });
        }
    } catch (error) {
        console.error("❌ Error al enviar mensaje:", error);
        res.status(500).json({ status: "error", message: "No se pudo enviar el mensaje" });
    }
};

/* === 🎙️ Enviar mensaje de voz === */
const sendVoiceMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const sender = req.user.id;
        const senderId = new mongoose.Types.ObjectId(sender);
        const cleanId = conversationId.trim();

        if (!req.file) {
            return res.status(400).json({ status: "error", message: "No se recibió archivo de voz" });
        }

        const voiceBuffer = req.file.buffer;
        const voiceMime = req.file.mimetype;
        const voiceName = req.file.originalname;

        const message = new Message({
            conversation: cleanId,
            sender,
            type: "audio",
            voice: {
                data: voiceBuffer,
                mime: voiceMime,
                name: voiceName
            },
            delivered: true
        });

        await message.save();

        const populated = await Message.findById(message._id)
            .populate("sender", "name avatar");

        const conversation = await Conversation.findById(cleanId);

        if (conversation && Array.isArray(conversation.participants)) {
            const senderStr = senderId.toString();
            const recipients = conversation.participants.filter(
                participant => participant.toString() !== senderStr
            );

            const updatedUnread = recipients.map(id => id.toString());
            conversation.unreadBy = updatedUnread;
            conversation.lastMessage = message._id;

            await conversation.save();

            populated.unreadBy = conversation.unreadBy;

            const io = req.app.get("socketio");

            recipients.forEach(recipientId => {
                io.to(recipientId.toString()).emit("new-message", populated);
                io.to(recipientId.toString()).emit("message-received", {
                    conversationId: cleanId
                });
            });

            io.to(cleanId).emit("message-updated", { conversationId: cleanId });

            res.status(201).json({ status: "success", message: populated });
        } else {
            res.status(404).json({ status: "error", message: "Conversación no válida" });
        }
    } catch (error) {
        console.error("❌ Error al enviar mensaje de voz:", error);
        res.status(500).json({ status: "error", message: "No se pudo enviar el mensaje de voz" });
    }
};

/* === 🕓 Obtener historial de mensajes === */
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const conversationIdClean = conversationId.trim();

        const messages = await Message.find({ conversation: conversationIdClean })
            .sort({ created_at: 1 })
            .populate("sender", "name avatar");

        res.status(200).json({ status: "success", messages });
    } catch (error) {
        console.error("❌ Error al recuperar mensajes:", error);
        res.status(500).json({ status: "error", message: "No se pudo obtener el historial de mensajes" });
    }
};

/* === 📦 Obtener conversaciones con mensajes incluidos === */
const getConversationsWithMessages = async (req, res) => {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.find({
            participants: userId
        })
            .populate("participants", "name avatar")
            .populate({
                path: "lastMessage",
                populate: { path: "sender", select: "name avatar" }
            })
            .lean();

        const enriched = await Promise.all(
            conversations.map(async (conv) => {
                const messages = await Message.find({
                    conversation: conv._id
                })
                    .sort({ created_at: 1 })
                    .select("sender readBy created_at type content imageUrl")
                    .populate("sender", "name avatar")
                    .lean();

                return {
                    ...conv,
                    messages
                };
            })
        );

        res.status(200).json({
            status: "success",
            conversations: enriched
        });
    } catch (error) {
        console.error("❌ Error al obtener conversaciones con mensajes:", error);
        res.status(500).json({
            status: "error",
            message: "No se pudieron cargar las conversaciones"
        });
    }
};

/* === ✅ Exportar todos los controladores === */
module.exports = {
    createConversation,
    sendMessage,
    sendVoiceMessage,
    getMessages,
    getConversationsWithMessages
};
