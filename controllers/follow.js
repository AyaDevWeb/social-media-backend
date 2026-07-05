//Importar modelo
const Follow = require("../models/follow.model");
const User = require("../models/user.model");

//Importar dependencias
const mongoosePaginate = require("mongoose-paginate-v2");

//Importar servicio
const followService = require("../services/followService")

// Acciones de prueba.
const pruebaFollow = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/follow.js"
    });
}

// Acción de guardar un follow (acción de seguir)
const save = async (req, res) => {
    try {
        // Conseguir datos por body
        const params = req.body;

        // Sacar id del usuario identificado
        const identity = req.user;

        // Verificar que el usuario a seguir existe
        const userToFollow = await User.findById(params.followed);
        if (!userToFollow) {
            return res.status(404).json({
                status: "error",
                message: "El usuario al que intentas seguir no existe."
            });
        }

        // Verificar que el usuario no se siga a sí mismo
        if (identity.id === params.followed) {
            return res.status(400).json({
                status: "error",
                message: "No puedes seguirte a ti mismo."
            });
        }

        // Verificar si ya sigues a este usuario
        const existingFollow = await Follow.findOne({
            user: identity.id,
            followed: params.followed
        });
        if (existingFollow) {
            return res.status(400).json({
                status: "error",
                message: "Ya sigues a este usuario."
            });
        }

        // Crear objeto con modelo Follow
        let userFollow = new Follow({
            user: identity.id,
            followed: params.followed
        });

        // Guardar objeto en la base de datos
        const followStored = await userFollow.save();

        return res.status(200).json({
            status: "success",
            identity: req.user,
            follow: followStored
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "No se ha podido seguir al usuario."
        });
    }
};

// Acción de borrar un follow (dejar de seguir)
const unfollow = async (req, res) => {
    try {
        // Recoger el id del usuario identificado
        const userId = req.user.id;

        // Recoger el id del usuario al que dejar de seguir
        const followedId = req.params.id;

        // Buscar si el follow existe
        const follow = await Follow.findOne({
            user: userId,
            followed: followedId
        });

        if (!follow) {
            return res.status(404).json({
                status: "error",
                message: "No sigues a este usuario."
            });
        }

        // Eliminar el follow
        await Follow.findOneAndDelete({
            user: userId,
            followed: followedId
        });

        return res.status(200).json({
            status: "success",
            message: "Dejaste de seguir al usuario."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Error al dejar de seguir al usuario.",
            error
        });
    }
};

/**
 * Acción para obtener los usuarios que sigue el usuario identificado
 * @route GET /api/follow/following/:id?/:page?
 * @param {String} id - El id del usuario cuyo seguimiento queremos ver. (opcional)
 * @param {Number} page - El número de página para la paginación. (opcional, por defecto es 1)
 * @returns {Object} - Devuelve un objeto con los usuarios seguidos y la información de la paginación.
 */
const following = async (req, res) => {
    try {
        // Obtener el ID del usuario desde los parámetros de la URL (si no se proporciona, se usa req.user.id)
        const userId = req.params.id || req.user.id;

        // Obtener el número de página desde los parámetros de la URL (si no se proporciona, se usa la página 1)
        const page = parseInt(req.params.page) || 1;
        const limitUsersPerPage = 5; // Número de usuarios por página

        const options = {
            page,
            limit: limitUsersPerPage,
            populate: {
                path: "followed",
                select: "-password -role -__v -email"
            }
        };

        // Paginación de los usuarios que el usuario está siguiendo
        const result = await Follow.paginate({ user: userId }, options);

        // Si no se encuentra a nadie seguido
        if (!result.docs || result.docs.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No sigues a ningún usuario."
            });
        }

        // Array de usuarios que me siguen y los que sigo
        let followUserIds = await followService.followUserIds(req.user.id);


        return res.status(200).json({
            status: "success",
            message: "Usuarios seguidos obtenidos correctamente.",
            follows: result.docs,
            totalUsers: result.totalDocs,  // Mongoose ya nos da el total
            totalPages: result.totalPages,  // Número total de páginas
            currentPage: result.page,  // Página actual
            hasPrevPage: result.hasPrevPage,  // Si hay una página anterior
            hasNextPage: result.hasNextPage,  // Si hay una página siguiente
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener los usuarios seguidos.",
            error
        });
    }
};



const followers = async (req, res) => {
    try {
        // Obtener el ID del usuario desde los parámetros de la URL (si no se proporciona, se usa req.user.id)
        const userId = req.params.id || req.user.id;

        // Obtener el número de página desde los parámetros de la URL (si no se proporciona, se usa la página 1)
        const page = parseInt(req.params.page) || 1;
        const limit = 5;  // Número de resultados por página

        // Opciones para la paginación
        const options = {
            page,
            limit,
            populate: { path: "user", select: "-password -role -__v -email" },
        };

        // Paginación
        const result = await Follow.paginate({ followed: userId }, options);

        // Si no se encuentran seguidores
        if (!result.docs || result.docs.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No tienes seguidores."
            });
        }

        // Array de usuarios que me siguen y los que sigo
        let followUserIds = await followService.followUserIds(req.user.id);

        // Devolver los datos de los seguidores con paginación y usuarios seguidos
        return res.status(200).json({
            status: "success",
            message: "Listado de usuarios que me siguen",
            follows: result.docs,
            totalUsers: result.totalDocs,  // Número total de seguidores
            currentPage: result.page,  // Página actual
            totalPages: result.totalPages,  // Número total de páginas
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });

    } catch (error) {
        console.error("Error en followers:", error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener los seguidores.",
            error: error.message
        });
    }
};

// Acción para verificar si el usuario autenticado sigue a otro usuario
const checkFollow = async (req, res) => {
    try {
        const userId = req.user.id;           // Usuario autenticado
        const targetId = req.params.id;       // Usuario que queremos verificar

        // Buscar si existe el follow
        const follow = await Follow.findOne({
            user: userId,
            followed: targetId
        });

        return res.status(200).json({
            status: "success",
            isFollowing: !!follow
        });
    } catch (error) {
        console.error("❌ Error en checkFollow:", error);
        return res.status(500).json({
            status: "error",
            message: "No se pudo verificar el seguimiento."
        });
    }
};


// Exportar acciones
module.exports = {
    pruebaFollow,
    save,
    unfollow,
    following,
    followers,
    checkFollow
}
