const express = require('express');

const {
    getCategories,
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require('../controllers/category.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCategories);
router.post('/', createCategory);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;