/**
 * Carga las funciones necesarias de Mongoose para definir esquemas y modelos.
 * @const {Function} Schema - Constructor para crear esquemas en Mongoose.
 * @const {Function} model - Función para definir un modelo basado en un esquema.
 */
const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const FollowSchema = Schema({
    user:{
        type: Schema.ObjectId,
        ref: "User"
    },
    followed: {
        type: Schema.ObjectId,
        ref: "User"
    },
    created_at:{
        type: Date,
        default: Date.now
    }
});

// Aplicar el plugin para la paginación
FollowSchema.plugin(mongoosePaginate);

/**
 * Exporta el modelo de follow para su uso en otras partes del proyecto.
 * @module follow.model
 * @returns {Model} Modelo de usuario basado en UserSchema.
 */
module.exports = model("follow.model", FollowSchema, "follows");
