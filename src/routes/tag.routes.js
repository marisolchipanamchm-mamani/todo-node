const express = require('express');

const {
    getTags,
    createTag,
    getTagById,
    updateTag,
    deleteTag
} = require('../controllers/tag.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getTags);
router.post('/', createTag);
router.get('/:id', getTagById);
router.put('/:id', updateTag);
router.delete('/:id', deleteTag);

module.exports = router;
