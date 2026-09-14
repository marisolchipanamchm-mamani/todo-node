const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const pool = require('../db/connection');
const userDecorator = require('../decorators/user.decorator');

const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Nombre, email y contraseña son obligatorios'
            });
        }

        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                error: 'El email ya está registrado'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = randomUUID();

        await pool.query(
            'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
            [id, name, email, hashedPassword]
        );

        res.status(201).json({
            mensaje: 'Usuario creado correctamente',
            usuario: userDecorator({
              id,
              name,
             email
             })
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Error al crear el usuario'
        });
    }
};

module.exports = {
    createUser
};