const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Publication", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    created_at: { type: Date, default: Date.now },

    // 🎯 Reacciones por tipo
    reactions: {
        like: { type: Number, default: 0 },
        love: { type: Number, default: 0 },
        laugh: { type: Number, default: 0 }
    },

    // 🎯 Reacciones por usuario
    reactionUsers: {
        like: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        love: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        laugh: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
    }

});

module.exports = mongoose.model("Comment", commentSchema);
