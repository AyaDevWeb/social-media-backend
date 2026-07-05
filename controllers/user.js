// Importar dependencias y modulos
const bcrypt = require("bcrypt");
const mongoosePaginate = require("mongoose-paginate-v2");
const fs = require('fs');
const path = require('path');

// Importar modelos
const User = require("../models/user.model");
const Follow = require("../models/follow.model");
const Publication = require("../models/publication.model");

// Importar servicios
const jwt = require("../services/jwt");
const followService = require("../services/followService");

/**
 * Función para validar el formato del email.
 * 
 * @param {string} email - El email a validar.
 * @returns {boolean} true si es un email válido, false en caso contrario.
 */
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA021]{2,6}$/;
    return emailRegex.test(email);
}

/**
 * Acción de prueba para verificar el usuario autenticado.
 * 
 * @function pruebaUser
 * @param {Object} req - La solicitud que contiene los datos del usuario verificado.
 * @param {Object} res - La respuesta con los datos del usuario.
 * @returns {Object} Respuesta con mensaje y datos del usuario.
 */
const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: "Mensaje desde controllers/user.js",
        usuario: req.user // Datos del usuario verificado en el middleware
    });
};

/**
 * Registro de usuario. Valida los datos y crea un nuevo usuario.
 * 
 * @function register
 * @param {Object} req - La solicitud con los datos del usuario.
 * @param {Object} res - La respuesta con el resultado del registro.
 * @returns {Object} Respuesta con el resultado del registro.
 */
const register = (req, res) => {
    let params = req.body;

    // Validar campos obligatorios
    if (!params.name || !params.email || !params.password || !params.nick) {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos obligatorios.",
        });
    }

    // Validar el formato del email
    if (!isValidEmail(params.email)) {
        return res.status(400).json({
            status: "error",
            message: "El formato del correo electrónico no es válido. Ejemplo: usuario@dominio.com",
        });
    }

    let userData = new User(params);

    // Comprobar si el usuario ya existe
    User.findOne({
        $or: [
            { email: userData.email.toLowerCase() },
            { nick: userData.nick.toLowerCase() }
        ]
    }).exec()
        .then(users => {
            if (users) {
                return res.status(200).send({
                    status: "success",
                    message: "El correo o el nombre de usuario ya están registrados.",
                });
            }

            // Cifrar la contraseña
            bcrypt.hash(userData.password, 10, (error, hash) => {
                if (error) {
                    return res.status(500).json({
                        status: "error",
                        message: "Error al cifrar la contraseña.",
                    });
                }

                userData.password = hash;

                // Guardar el nuevo usuario
                userData.save()
                    .then(user => {
                        return res.status(200).json({
                            status: "success",
                            message: "Usuario creado con éxito.",
                            user
                        });
                    })
                    .catch(err => {
                        return res.status(500).json({
                            status: "error",
                            message: "No se pudo guardar el usuario.",
                            err
                        });
                    });
            });
        })
        .catch(error => {
            return res.status(500).json({
                status: "error",
                message: "Error al consultar la base de datos.",
            });
        });
};

/**
 * Inicio de sesión. Valida el usuario y contraseña, y devuelve un token.
 * 
 * @function login
 * @param {Object} req - La solicitud con las credenciales del usuario.
 * @param {Object} res - La respuesta con el token y los datos del usuario.
 * @returns {Object} Respuesta con el resultado del login y el token generado.
 */
const login = (req, res) => {
    console.log(req.body)
    let params = req.body;

    // Validar que se proporcionen credenciales
    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error",
            message: "Faltan usuario o contraseña.",
        });
    }

    // Buscar el usuario en la base de datos
    User.findOne({ email: params.email })
        .exec()
        .then(user => {
            if (!user) {
                return res.status(404).send({
                    status: "error",
                    message: "Usuario no encontrado.",
                });
            }

            // Verificar la contraseña
            const pwd = bcrypt.compareSync(params.password, user.password);
            if (!pwd) {
                return res.status(400).send({
                    status: "error",
                    message: "Contraseña incorrecta.",
                });
            }

            // Generar el token
            const token = jwt.generateToken(user);

            // Responder con el token y datos del usuario
            return res.status(200).send({
                status: "success",
                message: "Login exitoso.",
                user: {
                    id: user._id,
                    name: user.name,
                    nick: user.nick
                },
                token
            });
        })
};

/**
 * Obtiene el perfil de un usuario por su ID.
 * 
 * @function getProfile
 * @param {Object} req - La solicitud con el ID del usuario en la URL.
 * @param {Object} res - La respuesta con los datos del perfil del usuario.
 * @returns {Object} Respuesta con el perfil del usuario o un error.
 */
const getProfile = async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({
            status: "error",
            message: "Falta el ID del usuario en la URL"
        });
    }

    try {
        const user = await User.findById(userId).select("-password -role");

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "Usuario no encontrado"
            });
        }

        // Información de seguimiento de usuarios, para comprobar si un usuario sigue a otro y viceversa
        const checkFollowStatus = async () => {
            try {
                const identityUserId = req.user.id;  // Usuario identificado
                const profileUserId = req.params.id; // Usuario al que se desea comprobar el seguimiento

                const followStatus = await followService.followThisUser(identityUserId, profileUserId);

                return followStatus;
            } catch (error) {
                console.error("Error al obtener el estado de seguimiento:", error);
                return {
                    status: "error",
                    message: "Error al obtener el estado de seguimiento.",
                    error
                };
            }
        };

        // Llamar a la función para obtener el estado de seguimiento
        const followStatusInfo = await checkFollowStatus();

        return res.status(200).json({
            status: "success",
            user,
            following: followStatusInfo.userFollowsId,
            follower: followStatusInfo.profileFollowsId
        });

    } catch (err) {
        console.error("Error al obtener el perfil del usuario:", err);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener el perfil del usuario",
            err
        });
    }
};

/**
 * Lista los usuarios con paginación.
 * 
 * @function list
 * @param {Object} req - La solicitud con los parámetros de la página.
 * @param {Object} res - La respuesta con los usuarios de la página solicitada.
 * @returns {Object} Respuesta con los usuarios, total de usuarios, páginas y página actual.
 */
const list = async (req, res) => {
    try {
        const page = parseInt(req.params.page) || 1; // Página por defecto es 1
        const limitUsersPerPage = 5; // Número de usuarios por página

        // Usar la paginación con mongoose-pagination v2
        const users = await User.paginate(
            {}, // Filtro vacío para que devuelva todos los usuarios
            {
                page, // Página actual
                limit: limitUsersPerPage, // Límite de usuarios por página
                select: "-password -email -role -__v", // Excluir campos en la respuesta
                sort: { created_at: -1 }, // Ordenar por fecha de creación
            }
        );

        // Obtener los ids de los usuarios que el usuario autenticado sigue y los que lo siguen
        let followUserIds = await followService.followUserIds(req.user.id);

        return res.status(200).json({
            status: "success",
            data: users.docs, // Los usuarios paginados están en `docs`
            totalUsers: users.totalDocs,
            limitUsersPerPage: limitUsersPerPage,
            totalPages: users.totalPages,
            currentPage: users.currentPage,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Hubo un error al obtener los usuarios",
        });
    }
};

/**
 * Actualiza los datos del usuario autenticado.
 * 
 * @function updateUser
 * @param {Object} req - La solicitud con los datos a actualizar.
 * @param {Object} res - La respuesta con el resultado de la actualización.
 * @returns {Object} Respuesta con el usuario actualizado o un mensaje de error.
 */
const updateUser = (req, res) => {
    const userId = req.user.id;
    let updateData = req.body;

    // Validar los campos a actualizar
    if (updateData.email && !isValidEmail(updateData.email)) {
        return res.status(400).json({
            status: "error",
            message: "El formato del correo electrónico no es válido. Ejemplo: usuario@dominio.com",
        });
    }

    // Eliminar campos que no deben ser modificados
    delete updateData.role;
    delete updateData.avatar;
    delete updateData.cover;
    delete updateData.iat;
    delete updateData.exp;

    // Comprobar si el email o el nick ya existen en otro usuario
    User.findOne({
        $or: [
            { email: updateData.email?.toLowerCase() },
            { nick: updateData.nick?.toLowerCase() }
        ]
    }).exec()
        .then(existingUser => {
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(400).json({
                    status: "error",
                    message: "El correo o el nombre de usuario ya existen.",
                });
            }

            // Si el usuario quiere actualizar la contraseña, cifrarla antes de guardar
            if (updateData.password) {
                bcrypt.hash(updateData.password, 10, (error, hash) => {
                    if (error) {
                        return res.status(500).json({
                            status: "error",
                            message: "Error al cifrar la contraseña.",
                        });
                    }

                    updateData.password = hash; // Asignamos la contraseña cifrada
                    // Realizamos la actualización
                    updateUserData();
                });
            } else {
                // Si no hay contraseña, actualizar eliminando el campo password
                delete updateData.password;
                // Realizamos la actualización sin la contraseña
                updateUserData();
            }

            // Función para realizar la actualización
            function updateUserData() {
                User.findByIdAndUpdate(userId, updateData, { new: true })
                    .select("-password -role -avatar -created_at -__v")
                    .then(updatedUser => {
                        if (!updatedUser) {
                            return res.status(404).json({
                                status: "error",
                                message: "Usuario no encontrado.",
                            });
                        }
                        console.log("Datos que se van a guardar:", updateData);

                        return res.status(200).json({
                            status: "success",
                            message: "Usuario actualizado correctamente.",
                            user: updatedUser
                        });
                    })
                    .catch(err => {
                        return res.status(500).json({
                            status: "error",
                            message: "Error al actualizar el usuario.",
                            err
                        });
                    });
            }
        })
        .catch(err => {
            return res.status(500).json({
                status: "error",
                message: "Error al comprobar el usuario.",
                err
            });
        });
};

/**
 * Subir un avatar para el usuario autenticado.
 * 
 * @function uploadAvatar
 * @param {Object} req - La solicitud que contiene el archivo a subir.
 * @param {Object} res - La respuesta con el resultado de la subida del avatar.
 * @returns {Object} Respuesta con el archivo y el usuario actualizado.
 */
const uploadAvatar = async (req, res) => {
    try {
        // Comprobar que el fichero existe
        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "No se ha subido el archivo."
            });
        }

        // Actualizar el campo 'avatar' del usuario con el nombre del archivo
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user.id }, // Buscar por el id del usuario
            { avatar: req.file.filename }, // Guardar el nombre del archivo
            { new: true } // Devolver el usuario actualizado
        );

        // Verificar que se ha actualizado el usuario
        if (!updatedUser) {
            return res.status(404).json({
                status: "error",
                message: "Usuario no encontrado"
            });
        }

        // Generar URL completa para acceder a la imágen
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

        // Responder con el estado y la URL del archivo subido
        return res.status(200).json({
            status: "success",
            message: "Avatar subido correctamente.",
            user: updatedUser,
            file: {
                file: req.file,
                url: fileUrl
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Error al subir el archivo."
        });
    }
};

/**
 * Obtener el avatar del usuario desde el servidor.
 * 
 * @function avatar
 * @param {Object} req - La solicitud que contiene el nombre del archivo de imagen.
 * @param {Object} res - La respuesta con el archivo de imagen.
 * @returns {Object} Respuesta con el archivo de imagen o un error si no se encuentra.
 */
const avatar = (req, res) => {
    // Obtener el nombre del archivo de la URL
    const file = req.params.file;

    // Construir el path completo hacia el archivo de avatar
    const filePath = path.join(__dirname, '..', 'uploads', 'avatars', file);

    // Comprobar si el archivo existe
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Si el archivo no existe o no es un archivo, devolver un error
            return res.status(404).json({
                status: "error",
                message: "No existe la imagen"
            });
        }
        // Si el archivo existe, enviarlo como respuesta
        return res.status(200).sendFile(filePath);
    });
};

/**
 * Subir una portada para el usuario autenticado.

 * 
 * @function uploadCover
 * @param {Object} req - La solicitud que contiene el archivo a subir.
 * @param {Object} res - La respuesta con el resultado de la subida.
 * @returns {Object} Respuesta con el archivo y el usuario actualizado.
 */
const uploadCover = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "No se ha subido el archivo."
            });
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user.id },
            { cover: req.file.filename },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                status: "error",
                message: "Usuario no encontrado"
            });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/covers/${req.file.filename}`;

        return res.status(200).json({
            status: "success",
            message: "Portada subida correctamente.",
            user: updatedUser,
            file: {
                file: req.file,
                url: fileUrl
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Error al subir el archivo."
        });
    }
};

/**
 * Obtener la portada del usuario desde el servidor.
 * 
 * @function cover
 * @param {Object} req - La solicitud que contiene el nombre del archivo de imagen.
 * @param {Object} res - La respuesta con el archivo de imagen.
 * @returns {Object} Respuesta con el archivo de imagen o un error si no se encuentra.
 */
const cover = (req, res) => {
    // Obtener el nombre del archivo de la URL
    const file = req.params.file;

    // Construir el path completo hacia el archivo de cover
    const filePath = path.join(__dirname, '..', 'uploads', 'covers', file);

    // Comprobar si el archivo existe
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Si el archivo no existe o no es un archivo, devolver un error
            return res.status(404).json({
                status: "error",
                message: "No existe la imagen"
            });
        }
        // Si el archivo existe, enviarlo como respuesta
        return res.status(200).sendFile(filePath);
    });
};

/**
 * Obtener las estadísticas de un usuario, como los seguidores, los seguidos y las publicaciones.
 * 
 * @function count
 * @param {Object} req - La solicitud con los parámetros del usuario autenticado.
 * @param {Object} res - La respuesta con las estadísticas solicitadas.
 * @returns {Object} Respuesta con las estadísticas del usuario o un error.
 */
const count = async (req, res) => {
    try {
        // Obtener el ID del usuario
        const userId = req.params.id;

        // Verificar que el ID del usuario sea válido
        if (!userId) {
            return res.status(400).json({
                status: "error",
                message: "ID de usuario no válido o no proporcionado."
            });
        }

        // Contar los seguidores del usuario
        const followingCount = await Follow.countDocuments({ user: userId });

        // Contar los usuarios que siguen al usuario
        const followedCount = await Follow.countDocuments({ followed: userId });

        // Contar las publicaciones del usuario
        const publicationsCount = await Publication.countDocuments({ user: userId });

        // Responder con las estadísticas del usuario
        return res.status(200).json({
            status: "success",
            userId,
            following: followingCount,
            followed: followedCount,
            publications: publicationsCount
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Error al obtener las estadísticas del usuario.",
            error
        });
    }
};

// Exportar las funciones
module.exports = {
    pruebaUser,
    register,
    login,
    getProfile,
    list,
    updateUser,
    uploadAvatar,
    uploadCover,
    avatar,
    cover,
    count
};
