const express = require('express');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        mensaje: 'API To-Do List funcionando correctamente'
    });
});

// Rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint no encontrado'
    });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});