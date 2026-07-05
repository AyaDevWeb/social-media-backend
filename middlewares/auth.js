// Importar jsonwebtoken para validar tokens JWT
const jwt = require("jsonwebtoken");

/**
 * Middleware para verificar y decodificar el token JWT en la cabecera `Authorization`.
 * Si el token es válido, se agrega la información del usuario a `req.user`.
 * Si el token no es válido o falta, se responde con un error correspondiente.
 * 
 * @function verifyToken
 * @param {Object} req - La solicitud que contiene el token en los headers.
 * @param {Object} res - La respuesta que se usa para enviar el error si el token es inválido.
 * @param {Function} next - Función que se llama para pasar al siguiente middleware o ruta.
 * @returns {void}
 */
const verifyToken = (req, res, next) => {
    let raw = req.headers['authorization']?.replace(/['"]+/g, '');
    let token = raw?.startsWith("Bearer ") ? raw.slice(7) : raw;

    if (!token && req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(403).send({
            status: 'error',
            message: 'Acceso denegado, la petición no tiene la cabecera de autenticación.',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            status: 'error',
            message: 'Token inválido o expirado.',
        });
    }
};

// Exportar el middleware para que pueda ser utilizado en otros archivos
module.exports = { verifyToken };
