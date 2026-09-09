const { randomUUID } = require('crypto');
const pool = require('../db/connection');

// Listar categorías
const getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT id, name, user_id, created_at, updated_at FROM categories WHERE user_id = ?',
            [req.user.id]
        );

        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener las categorías'
        });
    }
};

// Crear categoría
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'El nombre de la categoría es obligatorio'
            });
        }

        const [existingCategories] = await pool.query(
            'SELECT id FROM categories WHERE name = ? AND user_id = ?',
            [name, req.user.id]
        );

        if (existingCategories.length > 0) {
            return res.status(409).json({
                error: 'La categoría ya existe'
            });
        }

        const id = randomUUID();

        await pool.query(
            'INSERT INTO categories (id, name, user_id) VALUES (?, ?, ?)',
            [id, name, req.user.id]
        );

        res.status(201).json({
            mensaje: 'Categoría creada correctamente',
            categoria: {
                id,
                name,
                user_id: req.user.id
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al crear la categoría'
        });
    }
};

// Ver una categoría
const getCategoryById = async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT id, name, user_id, created_at, updated_at FROM categories WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                error: 'Categoría no encontrada'
            });
        }

        res.json(categories[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener la categoría'
        });
    }
};

// Actualizar categoría
const updateCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'El nombre de la categoría es obligatorio'
            });
        }

        const [result] = await pool.query(
            'UPDATE categories SET name = ? WHERE id = ? AND user_id = ?',
            [name, req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Categoría no encontrada'
            });
        }

        res.json({
            mensaje: 'Categoría actualizada correctamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al actualizar la categoría'
        });
    }
};

// Eliminar categoría
const deleteCategory = async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM categories WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Categoría no encontrada'
            });
        }

        res.json({
            mensaje: 'Categoría eliminada correctamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al eliminar la categoría'
        });
    }
};

module.exports = {
    getCategories,
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory
};