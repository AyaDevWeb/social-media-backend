//Importar modelos
const Publication = require("../models/publication.model");

//Importar modulos
const fs = require("fs");
const path = require("path");

//Importar servicios
const followService = require("../services/followService");

// Acciones de prueba.
const pruebaPublication = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/publication.js"
    });
}

/**
 * Guarda una nueva publicación en la base de datos.
 * También emite un evento vía WebSocket para notificar a todos los usuarios conectados en tiempo real.
 * @route POST /api/publication/save
 * @param {Object} req - Objeto de solicitud con el cuerpo de la publicación.
 * @param {Object} res - Objeto de respuesta para devolver resultado al cliente.
 */
const save = async (req, res) => {
    try {
        // Recoger los datos enviados desde el frontend
        const params = req.body;

        /**
         * Validación de campos obligatorios:
         * - El texto de la publicación es requerido.
         */
        if (!params.text) {
            return res.status(400).json({
                status: "error",
                message: "El texto de la publicación es obligatorio."
            });
        }

        /**
         * Crear nueva publicación con los datos recibidos.
         * - Se asigna el usuario autenticado (extraído del token).
         */
        const newPublication = new Publication(params);
        newPublication.user = req.user.id;

        /**
         * Asignar imagen por defecto si el campo 'image' no existe.
         * - Evita fallos visuales o errores en el frontend.
         */
        if (!newPublication.image) {
            newPublication.image = "default.png";
        }

        /**
         * Guardar la publicación en la base de datos.
         */
        const publicationStored = await newPublication.save();

        /**
         * Obtener la instancia del WebSocket desde Express.
         * - Esto permite emitir eventos a todos los clientes conectados.
         */
        const io = req.app.get("socketio");

        /**
         * Reconsultar la publicación para incluir los datos del usuario populados.
         * - Esto asegura que el frontend reciba avatar, nombre y apellidos directamente.
         */
        const populatedPublication = await Publication.findById(publicationStored._id)
            .populate("user", "name surname avatar");

        /**
         * Emitir evento de nueva publicación vía WebSocket.
         * - Todos los clientes escuchan este evento en tiempo real.
         */
        io.emit("new-publication", populatedPublication);

        /**
         * Responder al cliente que hizo la petición con la publicación guardada.
         * - Se incluye la versión sin 'populate', por si se usa localmente.
         */
        return res.status(200).json({
            status: "success",
            message: "Publicación guardada correctamente.",
            publication: publicationStored
        });

    } catch (error) {
        console.error("Error al guardar la publicación:", error);

        /**
         * Manejo de errores generales del proceso.
         * - Devuelve información detallada para depuración.
         */
        return res.status(500).json({
            status: "error",
            message: "Error al guardar la publicación.",
            error: error.message
        });
    }
};



// Sacar publicación
const getPublication = async (req, res) => {
    try {
        const publicationId = req.params.id;

        // Buscar publicación por ID
        const publication = await Publication.findById(publicationId);

        if (!publication) {
            return res.status(404).json({
                status: "error",
                message: "Publicación no encontrada, no existe la publicación"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Publicación encontrada",
            publication
        });

    } catch (error) {
        console.error("Error al obtener la publicación:");
        return res.status(500).json({
            status: "error",
            message: "Error al obtener la publicación"
        });
    }
};

// Eliminar publicación
const deletePublication = async (req, res) => {
    try {
        const publicationId = req.params.id;

        // Buscar publicación por ID y eliminarla
        const publicationDeleted = await Publication.findByIdAndDelete(publicationId);

        if (!publicationDeleted) {
            return res.status(404).json({
                status: "error",
                message: "Publicación no encontrada"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Publicación eliminada correctamente",
            publication: publicationId
        });

    } catch (error) {
        console.error("Error al eliminar la publicación:");
        return res.status(500).json({
            status: "error",
            message: "Error al eliminar la publicación"
        });
    }
};

// Listar todas las publicaciones
const getAllPublications = async (req, res) => {
    try {
        const publications = await Publication.find().sort({ created_at: -1 }); // Ordenar por fecha

        return res.status(200).json({
            status: "success",
            message: "Listado de todas las publicaciones",
            publications
        });

    } catch (error) {
        console.error("Error al listar publicaciones:", error);
        return res.status(500).json({
            status: "error",
            message: "Error al listar las publicaciones",
            error: error.message
        });
    }
};

// Listar publicaciones de un usuario
const getUserPublications = async (req, res) => {
    try {
        const userId = req.params.id;

        //Comprobamos que exista el id
        if (!userId) {
            return res.status(400).json({
                status: "error",
                message: "El ID del usuario es obligatorio"
            });
        }

        // const page = parseInt(req.params.page) || 1;
        // const limit = parseInt(req.params.limit) || 5;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        // Opciones para la paginación
        const options = {
            page,
            limit,
            populate: { path: "user", select: "-password -role -__v -email" },
            sort: { created_at: -1 }
        };

        // Aplicar paginación usando mongoose-pagination-v2
        const result = await Publication.paginate({ user: userId }, options);

        // Si no hay publicaciones, devolver un mensaje adecuado
        if (!result.docs.length) {
            return res.status(404).json({
                status: "error",
                message: "No se encontraron publicaciones para este usuario"
            });
        }

        return res.status(200).json({
            status: "success",
            message: `Listado de publicaciones del usuario ${userId}`,
            totalPublications: result.totalDocs, // Número total de publicaciones
            currentPage: result.page,  // Página actual
            totalPages: result.totalPages,  // Número total de páginas
            publications: result.docs // Muestra las publicaciones
        });

    } catch (error) {
        console.error("Error al listar publicaciones del usuario.");
        return res.status(500).json({
            status: "error",
            message: "Error al listar las publicaciones del usuario"
        });
    }
};

// Subir ficheros
const uploadFile = async (req, res) => {
    try {
        const publicationId = req.params.id;

        // Comprobar si se subió un archivo
        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "No se ha subido ninguna imagen."
            });
        }

        // Actualizar la publicación con el nombre de la imagen subida
        const updatedPublication = await Publication.findByIdAndUpdate(
            { _id: publicationId, user: req.user.id },
            { image: req.file.filename },
            { new: true }
        );

        if (!updatedPublication) {
            return res.status(404).json({
                status: "error",
                message: "Publicación no encontrada."
            });
        }

        // ✅ Emitir la publicación actualizada vía WebSocket
        const io = req.app.get("socketio");

        const populatedPublication = await Publication.findById(updatedPublication._id)
            .populate("user", "name surname avatar");

        io.emit("new-publication", populatedPublication);

        // Generar URL completa de la imagen (opcional)
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/publications/${req.file.filename}`;

        return res.status(200).json({
            status: "success",
            message: "Imagen subida correctamente.",
            publication: updatedPublication,
            file: req.file
        });

    } catch (error) {
        console.error("Error al subir la imagen:", error);
        return res.status(500).json({
            status: "error",
            message: "Error al subir la imagen.",
            error: error.message
        });
    }
};


// Devolver archivos multimedia imágenes
const getFile = (req, res) => {
    const file = req.params.file;
    const filePath = path.join(__dirname, "..", "uploads", "publications", file);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            return res.status(404).json({
                status: "error",
                message: "No existe la imagen."
            });
        }
        return res.status(200).sendFile(filePath);
    });
};

// Listar todas las publicaciones (Feed).
const feed = async (req, res) => {
    try {
        // Página actual (por defecto, 1)
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // Número de publicaciones por página

        // Obtener los IDs de los usuarios que sigue el usuario autenticado
        const myFollows = await followService.followUserIds(req.user.id);

        // Buscar publicaciones de los usuarios seguidos
        const options = {
            page,
            limit,
            populate: { path: "user", select: "-password -role -__v -email" },
            sort: { created_at: -1 }
        };

        const result = await Publication.paginate({ user: { $in: myFollows.following } }, options);

        if (!result.docs.length) {
            return res.status(404).json({
                status: "error",
                message: "No hay publicaciones en el feed."
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Feed de publicaciones obtenido correctamente.",
            following: myFollows.following,
            totalPublications: result.totalDocs,
            currentPage: result.page,
            pages: result.pages,
            totalPages: result.totalPages,
            publications: result.docs
        });

    } catch (error) {
        console.error("Error al obtener el feed:", error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener el feed de publicaciones.",
            error: error.message
        });
    }
};

// Exportar acciones 
module.exports = {
    pruebaPublication,
    save,
    getPublication,
    deletePublication,
    getAllPublications,
    getUserPublications,
    uploadFile,
    getFile,
    feed
}