const { randomUUID } = require('crypto');
const pool = require('../db/connection');

// Crear tarea
const createTask = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            title,
            description,
            status,
            category_id,
            tag_ids,
            completed
        } = req.body;

        if (!title || !category_id) {
            connection.release();

            return res.status(400).json({
                error: 'El título y la categoría son obligatorios'
            });
        }

        const taskStatus = status !== undefined
            ? status
            : completed
                ? 'Completada'
                : 'Pendiente';

        const taskId = randomUUID();

        await connection.beginTransaction();

        // Verificar que la categoría pertenece al usuario
        const [categories] = await connection.query(
            'SELECT id FROM categories WHERE id = ? AND user_id = ?',
            [category_id, req.user.id]
        );

        if (categories.length === 0) {
            await connection.rollback();
            connection.release();

            return res.status(404).json({
                error: 'Categoría no encontrada'
            });
        }

        // Crear la tarea
        await connection.query(
            `INSERT INTO tasks
            (id, title, description, status, category_id, user_id)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                taskId,
                title,
                description || null,
                taskStatus,
                category_id,
                req.user.id
            ]
        );

        // Asociar etiquetas
        if (tag_ids && tag_ids.length > 0) {
            const [tags] = await connection.query(
                'SELECT id FROM tags WHERE id IN (?) AND user_id = ?',
                [tag_ids, req.user.id]
            );

            if (tags.length !== tag_ids.length) {
                await connection.rollback();
                connection.release();

                return res.status(400).json({
                    error: 'Una o más etiquetas no pertenecen al usuario'
                });
            }

            for (const tagId of tag_ids) {
                await connection.query(
                    'INSERT INTO tags_task (tag_id, task_id) VALUES (?, ?)',
                    [tagId, taskId]
                );
            }
        }

        await connection.commit();
        connection.release();

        res.status(201).json({
            success: true,
            message: 'Tarea creada correctamente.',
            data: {
                id: taskId,
                title,
                description: description || null,
                status: taskStatus,
                category_id,
                user_id: req.user.id,
                completed: taskStatus === 'Completada',
                tag_ids: tag_ids || []
            }
        });
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(rollbackError);
        }

        connection.release();

        console.error(error);

        res.status(500).json({
            error: 'Error al crear la tarea'
        });
    }
};

// Listar tareas del usuario
const getTasks = async (req, res) => {
    try {
        const [tasks] = await pool.query(
            `SELECT
                tasks.id,
                tasks.title,
                tasks.description,
                tasks.status,
                tasks.category_id,
                categories.name AS category_name,
                tasks.user_id,
                tasks.created_at,
                tasks.updated_at
            FROM tasks
            INNER JOIN categories
                ON tasks.category_id = categories.id
            WHERE tasks.user_id = ?`,
            [req.user.id]
        );

        for (const task of tasks) {
            const [tags] = await pool.query(
                `SELECT
                    tags.id,
                    tags.name
                FROM tags
                INNER JOIN tags_task
                    ON tags.id = tags_task.tag_id
                WHERE tags_task.task_id = ?
                  AND tags.user_id = ?`,
                [task.id, req.user.id]
            );

            task.tags = tags;
        }

        for (const task of tasks) {
            task.completed = task.status === 'Completada';
        }

        res.json({
            data: tasks
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Error al obtener las tareas'
        });
    }
};

// Ver una tarea por ID
const getTaskById = async (req, res) => {
    try {
        const [tasks] = await pool.query(
            `SELECT
                tasks.id,
                tasks.title,
                tasks.description,
                tasks.status,
                tasks.category_id,
                categories.name AS category_name,
                tasks.user_id,
                tasks.created_at,
                tasks.updated_at
            FROM tasks
            INNER JOIN categories
                ON tasks.category_id = categories.id
            WHERE tasks.id = ? AND tasks.user_id = ?`,
            [req.params.id, req.user.id]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                error: 'Tarea no encontrada'
            });
        }

        const task = tasks[0];

        const [tags] = await pool.query(
            `SELECT
                tags.id,
                tags.name
            FROM tags
            INNER JOIN tags_task
                ON tags.id = tags_task.tag_id
            WHERE tags_task.task_id = ?
              AND tags.user_id = ?`,
            [task.id, req.user.id]
        );

        task.tags = tags;
        task.completed = task.status === 'Completada';

        res.json({
            data: {
                ...task,
                category: {
                    id: task.category_id,
                    name: task.category_name
                }
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Error al obtener la tarea'
        });
    }
};

// Actualizar tarea
const updateTask = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const {
            title,
            description,
            status,
            category_id,
            tag_ids
        } = req.body;

        if (!title || !category_id) {
            connection.release();

            return res.status(400).json({
                error: 'El título y la categoría son obligatorios'
            });
        }

        await connection.beginTransaction();

        // Verificar que la categoría pertenece al usuario
        const [categories] = await connection.query(
            'SELECT id FROM categories WHERE id = ? AND user_id = ?',
            [category_id, req.user.id]
        );

        if (categories.length === 0) {
            await connection.rollback();
            connection.release();

            return res.status(404).json({
                error: 'Categoría no encontrada'
            });
        }

        // Actualizar la tarea
        const [result] = await connection.query(
            `UPDATE tasks
             SET title = ?, description = ?, status = ?, category_id = ?
             WHERE id = ? AND user_id = ?`,
            [
                title,
                description || null,
                status || 'Pendiente',
                category_id,
                req.params.id,
                req.user.id
            ]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            connection.release();

            return res.status(404).json({
                error: 'Tarea no encontrada'
            });
        }

        // Actualizar etiquetas
        if (tag_ids !== undefined) {
            if (!Array.isArray(tag_ids)) {
                await connection.rollback();
                connection.release();

                return res.status(400).json({
                    error: 'tag_ids debe ser un arreglo'
                });
            }

            const [tags] = tag_ids.length > 0
                ? await connection.query(
                    'SELECT id FROM tags WHERE id IN (?) AND user_id = ?',
                    [tag_ids, req.user.id]
                )
                : [[]];

            if (tags.length !== tag_ids.length) {
                await connection.rollback();
                connection.release();

                return res.status(400).json({
                    error: 'Una o más etiquetas no pertenecen al usuario'
                });
            }

            await connection.query(
                'DELETE FROM tags_task WHERE task_id = ?',
                [req.params.id]
            );

            for (const tagId of tag_ids) {
                await connection.query(
                    'INSERT INTO tags_task (tag_id, task_id) VALUES (?, ?)',
                    [tagId, req.params.id]
                );
            }
        }

        await connection.commit();
        connection.release();

        res.json({
            success: true,
            message: 'Tarea actualizada correctamente.'
        });
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(rollbackError);
        }

        connection.release();

        console.error(error);

        res.status(500).json({
            error: 'Error al actualizar la tarea'
        });
    }
};

// Eliminar tarea
const deleteTask = async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM tasks WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Tarea no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Tarea eliminada correctamente.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Error al eliminar la tarea'
        });
    }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
};
