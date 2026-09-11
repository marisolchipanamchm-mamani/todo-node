const express = require('express');

const {
    createUser,
    loginUser
} = require('../controllers/user.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', createUser);
router.post('/login', loginUser);

router.get('/perfil', authMiddleware, (req, res) => {
    res.json({
        mensaje: 'Acceso autorizado',
        user: req.user
    });
});

module.exports = router;