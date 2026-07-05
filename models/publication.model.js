const mongoosePaginate = require("mongoose-paginate-v2");
const { Schema, model } = require("mongoose");

const PublicationSchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User"
    },
    text: {
        type: String,
        required: true
    },
    file: {
        type: String,
    },
    image: {
        type: String,
        default: "default.png"
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Plugin de paginación
PublicationSchema.plugin(mongoosePaginate);

/**
 * Exporta el modelo de publication para su uso en otras partes del proyecto.
 * @module publication.model
 * @returns {Model} Modelo de usuario basado en UserSchema.
 */
module.exports = model("publication.model", PublicationSchema, "publications");
