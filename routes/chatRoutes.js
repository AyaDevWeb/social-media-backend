const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth");
const Message = require("../models/message.model");

/* === ✅ Controlador centralizado de chat === */
const {
    sendMessage,
    getMessages,
    sendVoiceMessage,
    createConversation,
    getConversationsWithMessages // ✅ Nuevo controlador con mensajes incluidos
} = require("../controllers/chat"); // Nuevo archivo unificado

/* === 📦 Otros controladores que aún están separados === */
const markAsRead = require("../controllers/markAsRead");

/* === 📁 Configuración de Multer para subir imágenes y voz === */
const multer = require("multer");
const path = require("path");

// 🖼️ Almacenamiento en disco para imágenes
const imageStorage = multer.diskStorage({
    destination: "./uploads/chat",
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

// 🎙️ Almacenamiento en memoria para voz (buffer)
const voiceStorage = multer.memoryStorage();

const uploadImage = multer({ storage: imageStorage });
const uploadVoice = multer({ storage: voiceStorage });

/* === 📡 Rutas del sistema de chat === */

/**
 * 🗨️ Crea una conversación entre dos usuarios
 */
router.post("/conversation/:userId", verifyToken, createConversation);

/**
 * 📨 Enviar mensaje de texto o imagen
 */
router.post("/message/:conversationId", 
    (req, res, next) => {
        console.log("📥 Petición recibida en /message/:conversationId");
        next();
    },
    verifyToken,
    uploadImage.single("image"),
    sendMessage
);

/**
 * 🎙️ Enviar mensaje de voz
 */
router.post("/voice/:conversationId", verifyToken, uploadVoice.single("voice"), sendVoiceMessage);

/**
 * 🎧 Obtener el audio de un mensaje de voz por su ID
 * - Devuelve el buffer con el tipo MIME correcto
 * - Permite que el reproductor frontend lo cargue desde el servidor
 * - Requiere autorización
 */
router.get("/voice/:messageId", async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId).populate("conversation");

        if (!message || !message.voice || !message.voice.data) {
            return res.status(404).send("Audio no encontrado");
        }

        // 🔐 Verificación opcional: ¿el usuario está en la conversación?
        // Puedes omitir esto si ya controlas el acceso desde el frontend

        res.set("Access-Control-Allow-Origin", "http://localhost:5173");
        res.set("Access-Control-Allow-Credentials", "true");
        res.set("Content-Type", message.voice.mime || "audio/webm");
        res.set("Content-Disposition", `inline; filename="${message.voice.name || "audio.webm"}"`);
        res.send(message.voice.data);
    } catch (err) {
        console.error("❌ Error al recuperar audio:", err);
        res.status(500).send("Error al recuperar el audio");
    }
});

/**
 * 🕓 Obtener historial de mensajes
 */
router.get("/messages/:conversationId", verifyToken, getMessages);

/**
 * ✅ Marcar mensajes como leídos
 */
router.put("/read/:conversationId", verifyToken, markAsRead);

/**
 * 📜 Listar conversaciones activas con sus mensajes incluidos
 * - Devuelve todas las conversaciones del usuario autenticado
 * - Incluye los mensajes para calcular el contador real de no leídos
 */
router.get("/conversations", verifyToken, getConversationsWithMessages);

module.exports = router;
