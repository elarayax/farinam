import { openDB } from 'idb';
import fs from 'fs'; // Importar fs para manipular archivos
import path from 'path'; // Importar path para manejar rutas de archivos
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPromise = openDB('your-database-name', 1, {
    upgrade(db) {
        // Crear la tabla zonas
        const zonasStore = db.createObjectStore('zonas', {
            keyPath: 'id',
            autoIncrement: true
        });
        zonasStore.createIndex('nombre', 'nombre');

        // Crear la tabla mesas
        const mesasStore = db.createObjectStore('mesas', {
            keyPath: 'id',
            autoIncrement: true
        });
        mesasStore.createIndex('zonaId', 'zonaId');
        mesasStore.createIndex('ocupada', 'ocupada');
        mesasStore.createIndex('estado', 'estado');
    }
});

// Función para agregar una zona
export const addZona = async (zona) => {
    const db = await dbPromise;
    const tx = db.transaction('zonas', 'readwrite');
    const store = tx.objectStore('zonas');
    await store.add(zona);
    await tx.done; // Asegúrate de que la transacción se completa
};

// Función para obtener todas las zonas
export const getZonas = async () => {
    const db = await dbPromise;
    return await db.getAll('zonas');
};

// Función para agregar una mesa
export const addMesa = async (mesa) => {
    const db = await dbPromise;
    const tx = db.transaction('mesas', 'readwrite');
    const store = tx.objectStore('mesas');
    await store.add(mesa);
    await tx.done; // Asegúrate de que la transacción se completa
};

// Función para obtener mesas por zona
export const getMesasByZonaId = async (zonaId) => {
    const db = await dbPromise;
    const tx = db.transaction('mesas', 'readonly');
    const store = tx.objectStore('mesas');
    const todasLasMesas = await store.getAll();
    const mesasFiltradas = todasLasMesas.filter(mesa => mesa.zonaId === zonaId);
    await tx.done; // Asegúrate de que la transacción se completa
    return mesasFiltradas;
};

// Función para exportar datos a un archivo JSON
export const exportToJsonFile = async () => {
    const db = await openDB('your-database-name', 1);
    const zonas = await db.getAll('zonas');
    const mesas = await db.getAll('mesas');

    const data = {
        zonas,
        mesas
    };

    const dataPath = path.join(__dirname, 'data', 'database.json');
    fs.mkdirSync(path.dirname(dataPath), { recursive: true }); // Asegúrate de que la carpeta exista
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2)); // Guardar el archivo JSON
    console.log('Datos exportados a', dataPath);
};

// Función para importar datos desde un archivo JSON
export const importFromJsonFile = async () => {
    const dataPath = path.join(__dirname, 'data', 'database.json');

    if (!fs.existsSync(dataPath)) {
        console.error('El archivo JSON no existe');
        return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath));

    const db = await openDB('your-database-name', 1);
    const tx = db.transaction(['zonas', 'mesas'], 'readwrite');

    // Limpiar las tablas
    await tx.objectStore('zonas').clear();
    await tx.objectStore('mesas').clear();

    // Insertar los nuevos datos
    data.zonas.forEach(zona => tx.objectStore('zonas').add(zona));
    data.mesas.forEach(mesa => tx.objectStore('mesas').add(mesa));

    await tx.done;
    console.log('Datos importados desde', dataPath);
};

// Función para eliminar la base de datos (opcional, para reiniciar)
export const deleteDatabase = async () => {
    await openDB('your-database-name', 1).then(db => db.delete());
};
