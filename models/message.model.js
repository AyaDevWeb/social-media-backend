/**
 * Modelo Message
 *
 * Representa un mensaje dentro de una conversación entre usuarios.
 * Puede ser de tipo texto, imagen o audio.
 *
 * @property {ObjectId} conversation - Referencia a la conversación.
 * @property {ObjectId} sender - Usuario que envía el mensaje.
 * @property {String} content - Texto del mensaje (opcional si es imagen/audio).
 * @property {String} imageUrl - URL pública de la imagen si se adjunta.
 * @property {String} type - Tipo de mensaje: "text", "image", "audio".
 * @property {Boolean} delivered - Indica si fue entregado.
 * @property {Boolean} read - Indica si fue leído.
 * @property {Date} created_at - Fecha de envío.
 */

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: function () {
            return !this.imageUrl && !this.voice?.data;
        }
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    imageUrl: {
        type: String,
        default: null
    },
    voice: {
        data: Buffer,
        mime: {
            type: String,
            default: null
        },
        name: {
            type: String,
            default: null
        }
    },
    type: {
        type: String,
        enum: ["text", "image", "audio"],
        default: "text"
    },
    delivered: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model("Message", messageSchema);
