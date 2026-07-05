/**
 * Carga las funciones necesarias de Mongoose para definir esquemas y modelos.
 * @const {Function} Schema - Constructor para crear esquemas en Mongoose.
 * @const {Function} model - Función para definir un modelo basado en un esquema.
 */
const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

/**
 * Esquema de usuario para la base de datos.
 * Define la estructura de los documentos dentro de la colección 'user'.
 */
const UserSchema = Schema({
    /**
     * Nombre del usuario.
     * @type {string}
     * @required
     */
    name: {
        type: String,
        required: true
    },

    /**
     * Apellido del usuario.
     * @type {string}
     */
    surname: String,

    /**
     * Biografia del usuario.
     * @type {string}
     */
    bio: String,

    /**
     * Nombre de usuario o alias.
     * @type {string}
     * @required
     */
    nick: {
        type: String,
        required: true
    },

    /**
     * Dirección de correo electrónico.
     * @type {string}
     * @required
     */
    email: {
        type: String,
        required: true
    },
    /**
    * Contraseña del usuario.
    * @type {string}
    * @required
    */
    password: {
        type: String,
        required: true
    },
    /**
     * Rol del usuario dentro de la aplicación.
     * Por defecto, se asigna el rol 'role_user'.
     * @type {string}
     * @default "role_user"
     */
    role: {
        type: String,
        default: "role_user"
    },

    /**
     * Imagen de perfil del usuario.
     * Se asigna 'default.png' si no se proporciona uno.
     * @type {string}
     * @default "default.png"
     */
    avatar: {
        type: String,
        default: "default.png"
    },
    cover: {
        type: String,
        default: ""
    },

    /**
     * Fecha de creación del usuario en la base de datos.
     * Se asigna automáticamente con la fecha actual.
     * @type {Date}
     * @default Date.now
     */
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Aplicar el plugin para la paginación
UserSchema.plugin(mongoosePaginate);

/**
 * Exporta el modelo de usuario para su uso en otras partes del proyecto.
 * @module user.model
 * @returns {Model} Modelo de usuario basado en UserSchema.
 */
module.exports = require("mongoose").model("User", UserSchema, "user");

