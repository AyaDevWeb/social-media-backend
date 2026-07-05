/**
 * Modelo Conversation
 *
 * Representa una conversación privada entre dos (o más) usuarios.
 * Cada conversación contiene una lista de participantes y la fecha de creación.
 *
 * @property {Array<ObjectId>} participants - Referencias a los usuarios involucrados.
 * @property {Date} created_at - Fecha de inicio de la conversación.
 */

const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    created_at: { type: Date, default: Date.now },

    // 🆕 Último mensaje enviado
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },

    // 🆕 Usuarios que aún no han leído el último mensaje
    unreadBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("Conversation", conversationSchema, "conversations");

