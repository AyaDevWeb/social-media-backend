const fs = require("fs");
const multer = require("multer");
const path = require("path");

// Crear directorio si no existe
const uploadDir = "./uploads/publications";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer para manejar la subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);  // Directorio de almacenamiento
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + "-" + file.originalname;  // Nombre del archivo con timestamp
        cb(null, filename);  // Se le asigna el nombre generado
    }
});

// Filtro de tipo de archivo (solo imágenes)
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);  // Aceptar archivo
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG o GIF.'), false);  // Rechazar archivo
    }
};

// Configuración de Multer con opciones de almacenamiento y filtro
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Limitar el tamaño de archivo a 2MB
});

// Middleware para la subida de la imagen
const uploadImage = upload.single("image");  // Campo 'image' en el formulario

module.exports = uploadImage;
