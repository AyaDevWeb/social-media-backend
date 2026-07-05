require("dotenv").config();
const connection = require("./database/connection");
const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

connection()
    .then(() => {
        console.log("¡Conexión exitosa a la base de datos!");

        const app = express();
        const server = http.createServer(app);
        const port = process.env.PORT || 4000;

        console.log("¡API Node para Red Social arrancada!");

        // CORS
        const corsOptions = {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            credentials: true
        };
        app.use(cors(corsOptions));

        // WebSockets
        const io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        app.set("socketio", io);

        io.on("connection", socket => {
            console.log("🟢 Cliente conectado vía WebSocket:", socket.id);

            socket.on("join-user", (userId) => {
                if (userId) {
                    socket.join(userId.toString());
                }
            });

            socket.on("join-conversation", ({ conversationId }) => {
                socket.join(conversationId);
            });

            socket.on("send-message", msg => {
                io.to(msg.conversation).emit("new-message", msg);
            });

            socket.on("typing", ({ conversationId, sender }) => {
                socket.to(conversationId).emit("user-typing", { conversationId, sender });
            });

            socket.on("message-updated", ({ conversationId }) => {
                io.to(conversationId).emit("message-updated", { conversationId });
            });

            socket.on("disconnect", () => {
                console.log("❌ Cliente desconectado:", socket.id);
            });
        });

        // Middlewares
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // Archivos estáticos
        app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

        // Rutas
        app.use("/api/user", require("./routes/userRoutes"));
        app.use("/api/chat", require("./routes/chatRoutes"));
        app.use("/api/publication", require("./routes/publicationRoutes"));
        app.use("/api/follow", require("./routes/followRoutes"));
        app.use("/api/comments", require("./routes/commentRoutes"));

        // Ruta de prueba
        app.get("/ruta-prueba", (req, res) => {
            return res.status(200).json({ id: 1, name: "Adriana" });
        });

        // Manejo de errores
        app.use(errorHandler);

        // Arranque del servidor
        server.listen(port, () => {
            console.log("✅ Servidor corriendo en el puerto", port);
        });
    })
    .catch((err) => {
        console.error("❌ Error al conectar a la base de datos:", err);
        process.exit(1);
    });
