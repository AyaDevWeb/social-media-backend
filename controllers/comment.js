const mongoose = require("mongoose");
const Comment = require("../models/comment.model");

// 🧾 Obtener comentarios de una publicación
const getCommentsByPost = async (req, res) => {
    try {
        const postId = req.params.postId?.trim();

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                status: "error",
                message: "El ID de la publicación no es válido."
            });
        }

        const comments = await Comment.find({ post: postId })
            .populate("user", "name surname avatar")
            .sort({ created_at: -1 });

        return res.status(200).json({
            status: "success",
            comments
        });
    } catch (error) {
        console.error("❌ Error al obtener comentarios:", error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener los comentarios"
        });
    }
};

// 📝 Guardar un nuevo comentario
const saveComment = async (req, res) => {
    try {
        const postId = req.params.postId?.trim();
        const { content } = req.body;

        if (!content || !postId) {
            return res.status(400).json({
                status: "error",
                message: "El contenido y el ID de la publicación son obligatorios."
            });
        }

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                status: "error",
                message: "El ID de la publicación no es válido."
            });
        }

        const newComment = new Comment({
            post: postId,
            user: req.user.id,
            content,
            reactions: { like: 0, love: 0, laugh: 0 } // 👈 Inicializamos reacciones
        });

        const savedComment = await newComment.save();

        const populatedComment = await Comment.findById(savedComment._id)
            .populate("user", "name surname avatar");

        const io = req.app.get("socketio");
        io.emit("new-comment", {
            postId,
            comment: populatedComment
        });

        return res.status(201).json({
            status: "success",
            message: "Comentario guardado correctamente.",
            comment: populatedComment
        });

    } catch (error) {
        console.error("❌ Error al guardar el comentario:", error);
        return res.status(500).json({
            status: "error",
            message: "No se pudo guardar el comentario.",
            error: error.message
        });
    }
};

const updateReaction = async (req, res) => {
    try {
        const commentId = req.params.id?.trim();
        const { type } = req.body;
        const userId = req.user.id;
        const validTypes = ["like", "love", "laugh"];

        if (!validTypes.includes(type)) {
            return res.status(400).json({ status: "error", message: "Tipo de reacción inválido." });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ status: "error", message: "Comentario no encontrado." });
        }

        // Inicializar estructuras si no existen
        if (!comment.reactions) {
            comment.reactions = { like: 0, love: 0, laugh: 0 };
        }
        if (!comment.reactionUsers) {
            comment.reactionUsers = { like: [], love: [], laugh: [] };
        }

        const hasReacted = comment.reactionUsers[type].includes(userId);

        if (hasReacted) {
            // Quitar reacción
            comment.reactionUsers[type] = comment.reactionUsers[type].filter(id => id.toString() !== userId);
            comment.reactions[type] = Math.max(0, comment.reactions[type] - 1);
        } else {
            // Añadir reacción
            comment.reactionUsers[type].push(userId);
            comment.reactions[type] += 1;
        }

        await comment.save();

        const io = req.app.get("socketio");
        io.emit("reaction-updated", {
            commentId: comment._id.toString(),
            type,
            userId,
            action: hasReacted ? "removed" : "added"
        });

        return res.status(200).json({
            status: "success",
            message: hasReacted ? "Reacción eliminada." : "Reacción añadida."
        });

    } catch (error) {
        console.error("❌ Error al actualizar reacción:", error);
        return res.status(500).json({
            status: "error",
            message: "No se pudo actualizar la reacción.",
            error: error.message
        });
    }
};


exports.toggleReaction = async (req, res) => {
    try {
        const commentId = req.params.id;
        const { type } = req.body;
        const userId = req.user.id;

        const validTypes = ["like", "love", "laugh"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ status: "error", message: "Tipo de reacción inválido" });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ status: "error", message: "Comentario no encontrado" });
        }

        // Inicializar reactionUsers si no existe
        if (!comment.reactionUsers) {
            comment.reactionUsers = { like: [], love: [], laugh: [] };
        }

        const alreadyReacted = comment.reactionUsers[type].includes(userId);

        if (alreadyReacted) {
            // Quitar reacción
            comment.reactionUsers[type] = comment.reactionUsers[type].filter(id => id.toString() !== userId);
            comment.reactions[type] = Math.max(0, comment.reactions[type] - 1);
        } else {
            // Añadir reacción
            comment.reactionUsers[type].push(userId);
            comment.reactions[type] = (comment.reactions[type] || 0) + 1;
        }

        await comment.save();

        // Emitir evento por socket si usas uno
        req.io?.emit("reaction-updated", { commentId, type, userId, action: alreadyReacted ? "removed" : "added" });

        return res.status(200).json({ status: "success", updated: true });
    } catch (err) {
        console.error("Error en toggleReaction:", err.message);
        return res.status(500).json({ status: "error", message: "Error interno del servidor" });
    }
};

module.exports = {
    getCommentsByPost,
    saveComment,
    updateReaction
};
