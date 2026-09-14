require('dotenv').config();

const express = require('express');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const tagRoutes = require('./routes/tag.routes');
const taskRoutes = require('./routes/task.routes');

const app = express();

app.use(express.json());

app.use('/api/users', userRoutes);
app.post('/api/login', require('./controllers/user.controller').loginUser);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
    res.json({
        mensaje: 'API To-Do List funcionando correctamente'
    });
});

const PORT = 8000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
