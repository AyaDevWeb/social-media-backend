// Importar mongoose para interactuar con la base de datos MongoDB
const mongoose = require("mongoose");

/**
 * Establece la conexión con la base de datos MongoDB.
 * 
 * ✔ Si existe la variable de entorno MONGO_URI (Render, producción), usa esa URL.
 * ✔ Si no existe, se podría usar una base de datos local (desarrollo), pero Render SIEMPRE usará MONGO_URI.
 * 
 * @async
 * @function connection
 * @throws {Error} Si la conexión falla.
 */
const connection = async () => {
    try {
        /**
         * Intentar conectar a la base de datos usando la URI de MongoDB Atlas.
         * 
         * Se añaden opciones recomendadas para evitar warnings y asegurar compatibilidad
         * con Mongoose 8 y entornos como Render.
         */
        const db = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Si la conexión es exitosa, mostrar el host de la base de datos en consola
        console.log("✔ Conectado correctamente a MongoDB Atlas en:", db.connection.host);
    } catch (error) {
        /**
         * Si ocurre un error, mostrar mensaje detallado en consola.
         * 
         * Se usa process.exit(1) para que Render reinicie el servicio automáticamente
         * y no quede colgado en un estado inconsistente.
         */
        console.error("❌ Error al conectar a la base de datos:", error.message);
        process.exit(1);
    }
};

// Exportar la función de conexión para que pueda ser utilizada en otras partes de la aplicación
module.exports = connection;

