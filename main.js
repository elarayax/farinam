import { app, BrowserWindow, shell } from 'electron';
import express from 'express';

// Inicializa Express
const expressApp = express();
const port = 3000; // Puedes elegir cualquier puerto disponible

// Configura las rutas para el cliente
expressApp.get('/', (req, res) => {
  res.send('Página principal de Farinam para mozos');
});

// Inicia el servidor de Express
expressApp.listen(port, () => {
  console.log(`Servidor de Farinam disponible en http://localhost:${port}`);
});

// Función para abrir el sitio
function openFarinamSite() {
  const url = 'http://farinam.flamen'; // Asegúrate de usar el protocolo http o https
  shell.openExternal(url);
}

// Crear la ventana principal de Electron
app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true // Permite el uso de <webview>
    }
  });

  // Cargar el archivo HTML que contiene el WebView
  mainWindow.loadFile('src/vistas/index.html'); 

  // Abre el sitio en el navegador
  openFarinamSite(); // Si quieres abrirlo en el navegador
});
