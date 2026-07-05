const express = require("express");
const router = express.Router();
const FollowController = require("../controllers/follow"); 
const token = require("../middlewares/auth").verifyToken;

// Definir rutas 
router.get("/prueba-follow", FollowController.pruebaFollow);
router.post("/save", token, FollowController.save);
router.delete("/unfollow/:id", token, FollowController.unfollow);
router.get("/following/:id?/:page?", token, FollowController.following);
router.get("/followers/:id?/:page?", token, FollowController.followers);
router.get("/check/:id", token, FollowController.checkFollow);



// Exportar router
module.exports = router;