const express = require('express');

const {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
} = require('../controllers/task.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Todas las rutas de tareas requieren autenticación
router.use(authMiddleware);

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;