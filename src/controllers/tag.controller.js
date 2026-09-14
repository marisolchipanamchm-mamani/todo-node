const { randomUUID } = require('crypto');
const pool = require('../db/connection');

// Listar etiquetas
const getTags = async (req, res) => {
    try {
        const [tags] = await pool.query(
            'SELECT id, name, user_id, created_at, updated_at FROM tags WHERE user_id = ?',
            [req.user.id]
        );

        res.json({
            data: tags
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener las etiquetas'
        });
    }
};

// Crear etiqueta
const createTag = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'El nombre de la etiqueta es obligatorio'
            });
        }

        const [existingTags] = await pool.query(
            'SELECT id FROM tags WHERE name = ? AND user_id = ?',
            [name, req.user.id]
        );

        if (existingTags.length > 0) {
            return res.status(409).json({
                error: 'La etiqueta ya existe'
            });
        }

        const id = randomUUID();

        await pool.query(
            'INSERT INTO tags (id, name, user_id) VALUES (?, ?, ?)',
            [id, name, req.user.id]
        );

        res.status(201).json({
            success: true,
            message: 'Etiqueta creada correctamente.',
            data: {
                id,
                name,
                user_id: req.user.id
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al crear la etiqueta'
        });
    }
};

// Ver una etiqueta
const getTagById = async (req, res) => {
    try {
        const [tags] = await pool.query(
            'SELECT id, name, user_id, created_at, updated_at FROM tags WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (tags.length === 0) {
            return res.status(404).json({
                error: 'Etiqueta no encontrada'
            });
        }

        res.json(tags[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener la etiqueta'
        });
    }
};

// Actualizar etiqueta
const updateTag = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'El nombre de la etiqueta es obligatorio'
            });
        }

        const [result] = await pool.query(
            'UPDATE tags SET name = ? WHERE id = ? AND user_id = ?',
            [name, req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Etiqueta no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Etiqueta actualizada correctamente.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al actualizar la etiqueta'
        });
    }
};

// Eliminar etiqueta
const deleteTag = async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM tags WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Etiqueta no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Etiqueta eliminada correctamente.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al eliminar la etiqueta'
        });
    }
};

module.exports = {
    getTags,
    createTag,
    getTagById,
    updateTag,
    deleteTag
};
