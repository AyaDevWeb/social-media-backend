const express = require("express");
const router = express.Router();
const UserPublication = require("../controllers/publication");
const token = require("../middlewares/auth").verifyToken;
const upload = require("../utils/uploadPublication");

// Definir rutas 
router.get("/prueba-publication", UserPublication.pruebaPublication);
router.post("/save", token, UserPublication.save);
router.get("/detail/:id", token, UserPublication.getPublication);
router.delete("/delete/:id", token, UserPublication.deletePublication);
router.get("/user/:id/:page?", token, UserPublication.getUserPublications);
router.get("/all", token, UserPublication.getAllPublications);

// Ruta para subir imagen de una publicación, manejo de error para añadir toast en el front.
router.post("/upload/:id", token, (req, res, next) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                status: "error",
                message: err.message
            });
        }
        next();
    });
}, UserPublication.uploadFile);


// Ruta para obtener una imagen de una publicación
router.get("/media/:file", UserPublication.getFile);

router.get("/feed/:page?", token, UserPublication.feed);

// Exportar router
module.exports = router;