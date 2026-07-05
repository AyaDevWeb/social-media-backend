// Importar mongoose para interactuar con la base de datos MongoDB
const mongoose = require("mongoose");

/**
 * Establece la conexión con la base de datos MongoDB.
 * Si hay una variable de entorno MONGO_URI, usa esa URL.
 * Si no, se conecta a la base de datos local en "mongodb://localhost:27017/redsocial_db".
 * 
 * @async
 * @function connectToDatabase
 * @throws {Error} Si la conexión falla.
 */
const connection = async () => {
    try {
        // Intentar conectar a la base de datos usando la URI de MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        // Si la conexión es exitosa, mostrar mensaje en la consola
        console.log("\u2705 Conectado correctamente a la base de datos.");
    } catch (error) {
        // Si ocurre un error, mostrar mensaje de error en la consola
        console.error("\u274C Error al conectar a la base de datos:", error);
        // Lanzar un error personalizado
        throw new Error("No se pudo establecer la conexión con la base de datos.");
    }
};

// Exportar la función de conexión para que pueda ser utilizada en otras partes de la aplicación
module.exports = connection;

