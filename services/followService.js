const Follow = require("../models/follow.model");

const followUserIds = async (identityUserId) => {
    try {
        // Obtener los usuarios a los que sigue identityUserId
        const following = await Follow
            .find({ user: identityUserId })
            .select("followed");

        // Obtener los usuarios que siguen a identityUserId
        const followers = await Follow
            .find({ followed: identityUserId })
            .select("user");

        //Procesar array de identificadores
        return {
            following: following.map(f => f.followed),
            followers: followers.map(f => f.user)
        };
    } catch (error) {
        console.error("Error en followUserIds:", error);
        return {
            //Retornar arrays vacíos en caso de error
            following: [],
            followers: [],
        };
    }
};

// Método para comprobar si un usuario sigue a otro y viceversa
const followThisUser = async (identityUserId, profileUserId) => {
    try {
        // Verificar si identityUserId sigue a profileUserId
        const userFollows = await Follow
            .findOne({ user: identityUserId, followed: profileUserId });

        // Verificar si profileUserId sigue a identityUserId
        const profileFollows = await Follow
            .findOne({ user: profileUserId, followed: identityUserId });

        return {
            userFollowsId: userFollows ? userFollows : null,   // ID de la relación si existe
            profileFollowsId: profileFollows ? profileFollows : null  // ID de la relación inversa
        };
    } catch (error) {
        console.error("Error en followThisUser:", error);
        return {
            userFollows: null,
            profileFollows: null,
        };
    }
};


module.exports = {
    followUserIds,
    followThisUser
};