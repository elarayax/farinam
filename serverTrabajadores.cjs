const express = require('express');
const path = require('path');

const app = express();
const PORT = 3003;

// Middleware para servir archivos estáticos de la carpeta vistasTrabajadores
app.use(express.static(path.join(__dirname, 'vistasTrabajadores')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'vistasTrabajadores', 'colaborador.html'));
});

// Esta línea asegura que también sirva archivos .jsx como JavaScript
app.get('/main.jsx', (req, res) => {
    res.type('application/javascript'); // Especifica el tipo MIME como JavaScript
    res.sendFile(path.join(__dirname, 'vistasTrabajadores', 'main.jsx'));
});

app.get('*.jsx', (req, res) => {
  res.type('application/javascript'); // Especifica el tipo MIME como JavaScript
  res.sendFile(path.join(__dirname, 'vistasTrabajadores', req.path));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
