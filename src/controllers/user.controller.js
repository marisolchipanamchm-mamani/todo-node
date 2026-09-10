const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const pool = require('../db/connection');

// Crear usuario
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
            usuario: {
                id,
                name,
                email
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Error al crear el usuario'
        });
    }
};

// Iniciar sesión
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email y contraseña son obligatorios'
            });
        }

        const [users] = await pool.query(
            'SELECT id, name, email, password FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: 'Email o contraseña incorrectos'
            });
        }

        const user = users[0];

        const passwordValid = await bcrypt.compare(password, user.password);

        if (!passwordValid) {
            return res.status(401).json({
                error: 'Email o contraseña incorrectos'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '2h'
            }
        );

        res.json({
            mensaje: 'Inicio de sesión correcto',
            token
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Error al iniciar sesión'
        });
    }
};

module.exports = {
    createUser,
    loginUser
};