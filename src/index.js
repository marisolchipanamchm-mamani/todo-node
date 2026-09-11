require('dotenv').config();

const express = require('express');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(express.json());

app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.json({
        mensaje: 'API To-Do List funcionando correctamente'
    });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});