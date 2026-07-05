const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment");
const { verifyToken } = require("../middlewares/auth");

// 🧾 Obtener comentarios de una publicación
router.get("/post/:postId", commentController.getCommentsByPost);

// 📝 Guardar un nuevo comentario (requiere autenticación)
router.post("/post/:postId", verifyToken, commentController.saveComment);

// 💬 Actualizar reacciones de un comentario (requiere autenticación)
router.patch("/:id/reactions", verifyToken, commentController.updateReaction);

module.exports = router;
