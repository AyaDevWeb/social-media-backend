const fs = require("fs");
const multer = require("multer");
const path = require("path");

// Crear directorio si no existe
const uploadDir = "./uploads/avatars";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG o GIF.'), false);
    }
};

// Configuración de Multer para manejar la subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + "-" + file.originalname;
        cb(null, filename);
    }
});

// Middleware de Multer para gestionar la subida de archivos
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Limitar a 2MB por archivo
});

// Exportar directamente el middleware de Multer
module.exports = upload.single("avatar");
