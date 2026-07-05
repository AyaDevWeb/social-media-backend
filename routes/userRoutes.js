// Importar dependencias necesarias
const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user");
// Importar el middleware de autenticación para validar el token
const token = require("../middlewares/auth").verifyToken;
const upload = require("../utils/upload");
const uploadCover = require("../utils/uploadCover");


/**
 * Ruta de prueba para comprobar si el usuario está autenticado.
 * Esta ruta requiere un token válido para ser accedida.
 * 
 * @route GET /prueba-usuario
 * @middleware token - Verifica que el token de usuario sea válido.
 * @access Private
 */
router.get("/prueba-usuario", token, UserController.pruebaUser);

/**
 * Ruta para registrar un nuevo usuario en el sistema.
 * 
 * @route POST /register
 * @access Public
 */
router.post("/register", UserController.register);

/**
 * Ruta para iniciar sesión y obtener un token JWT.
 * 
 * @route POST /login
 * @access Public
 */
router.post("/login", UserController.login);

/**
 * Ruta para obtener el perfil de un usuario específico.
 * Esta ruta requiere un token válido para acceder.
 * 
 * @route GET /profile/:id
 * @param {string} id - ID del usuario cuyo perfil se desea obtener.
 * @middleware token - Verifica que el token de usuario sea válido.
 * @access Private
 */
router.get("/profile/:id", token, UserController.getProfile);

/**
 * Ruta para obtener la lista de usuarios paginada.
 * Se puede especificar la página de los resultados con el parámetro de consulta.
 * Esta ruta requiere un token válido.
 * 
 * @route GET /list/:page?
 * @param {number} page - Página de resultados (opcional).
 * @middleware token - Verifica que el token de usuario sea válido.
 * @access Private
 */
router.get("/list/:page?", token, UserController.list);

/**
 * Ruta para actualizar los datos de un usuario autenticado.
 * Esta ruta requiere un token válido para ser accedida.
 * 
 * @route PUT /update
 * @middleware token - Verifica que el token de usuario sea válido.
 * @access Private
 */
router.put("/update", token, UserController.updateUser);

/**
 * Ruta para subir un nuevo avatar para el usuario autenticado.
 * Esta ruta requiere un token válido y el archivo de imagen para el avatar.
 * 
 * @route POST /upload
 * @middleware token - Verifica que el token de usuario sea válido.
 * @middleware upload - Middleware que gestiona la subida del archivo de imagen.
 * @access Private
 */
router.post("/upload", token, upload, UserController.uploadAvatar);
router.post("/upload-cover", token, uploadCover, UserController.uploadCover);

/**
 * Ruta para obtener un avatar de un usuario.
 * El archivo de imagen es accesible a través de la URL.
 * 
 * @route GET /avatar/:file
 * @param {string} file - Nombre del archivo de la imagen del avatar.
 * @access Public
 */
router.get("/avatar/:file", UserController.avatar);

/**
 * Ruta para obtener una imagen de portada de un usuario.
 * El archivo de imagen es accesible a través de la URL.
 * 
 * @route GET /cover/:file
 * @param {string} file - Nombre del archivo de la imagen de portada.
 * @access Public
 */
router.get("/cover/:file", UserController.cover);

/**
 * Ruta para obtener las estadísticas del usuario, como los seguidores, seguidos y publicaciones.
 * Esta ruta requiere un token válido para ser accedida.
 * 
 * @route GET /counters/:id
 * @param {string} id - ID del usuario cuyas estadísticas se desean obtener.
 * @middleware token - Verifica que el token de usuario sea válido.
 * @access Private
 */
router.get("/counters/:id", token, UserController.count);

// Exportar el router para que se pueda usar en otros archivos
module.exports = router;
