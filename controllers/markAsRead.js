const mongoose = require("mongoose");
const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");

const markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const cleanId = conversationId.trim();
        const userId = req.user.id;
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // ✅ Marca como leídos TODOS los mensajes no leídos por este usuario (incluidos los que él envió)
        const updated = await Message.updateMany(
            {
                conversation: cleanId,
                sender: { $ne: userObjectId },       // 👈 solo mensajes que no envió el usuario
                readBy: { $ne: userObjectId }        // 👈 que aún no haya leído
            },
            {
                $push: { readBy: userObjectId }
            }
        );



//
const updatedMessages = await Message.find({
  conversation: cleanId,
  sender: { $ne: userObjectId },
  readBy: userObjectId
});

console.log("📦 Mensajes marcados como leídos:", updatedMessages.map(m => ({
  id: m._id,
  readBy: m.readBy
})));

//


        // 🧹 Elimina al usuario del array `unreadBy` de la conversación
        await Conversation.findByIdAndUpdate(cleanId, {
            $pull: { unreadBy: userObjectId }
        });

        // 📡 Notifica al frontend solo si hubo actualizaciones reales
        if (updated.modifiedCount > 0) {
            const io = req.app.get("socketio");
            io.emit("message-updated", { conversationId: cleanId });
            console.log(`✅ ${updated.modifiedCount} mensajes marcados como leídos por ${userId}`);
        }

        res.status(200).json({
            status: "success",
            message: "Mensajes marcados como leídos",
            updatedCount: updated.modifiedCount
        });
    } catch (error) {
        console.error("❌ Error al marcar mensajes como leídos:", error);
        res.status(500).json({
            status: "error",
            message: "No se pudieron actualizar los mensajes"
        });
    }
};

module.exports = markAsRead;
