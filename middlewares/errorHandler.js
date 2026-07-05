/**
 * Middleware para manejar los errores en la aplicación.
 * 
 * @param {Object} err - El objeto de error capturado.
 * @param {Object} req - La solicitud que causó el error.
 * @param {Object} res - La respuesta que se devolverá al cliente.
 * @param {Function} next - La función que se llama para pasar al siguiente middleware (si es necesario).
 */
const errorHandler = (err, req, res, next) => {
    // Imprimir el stack trace del error en la consola para depuración
    console.error(err.stack);

    // Responder al cliente con el código de estado adecuado
    res.status(err.statusCode || 500).json({

        // Mensaje del error que se envía al cliente
        message: err.message || "Ocurrió un error en el servidor",
        // Si estamos en desarrollo, mostramos el stack trace completo, de lo contrario, solo el mensaje
        error: process.env.NODE_ENV === 'development' ? err.stack : err.message
    });
};

// Exportar el middleware para que pueda ser utilizado en otros archivos
module.exports = errorHandler;
