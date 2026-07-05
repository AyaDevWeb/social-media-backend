const express = require("express");
const router = express.Router();

router.get("/test", (req, res) => {
    return res.status(200).json({
        message: "API funcionando correctamente desde Render 🚀"
    });
});

module.exports = router;
