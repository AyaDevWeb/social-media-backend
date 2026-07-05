// Importar dependencias
const jwt = require("jsonwebtoken");
require('dotenv').config();

// Clave secreta para firmar tokens
const secretKey = process.env.TOKEN_SECRET;

// Crear una función para generar tokens JWT
const generateToken = (user) => {
    const payload = {
        id: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        cover: user.cover
    };

    return jwt.sign(payload, secretKey, {
        expiresIn: '30d'
    });
};

// Exportar la función para que se pueda usar en otros archivos
module.exports = {
    generateToken
};
